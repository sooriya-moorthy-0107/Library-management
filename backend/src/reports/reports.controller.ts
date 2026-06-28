import { Controller, Get, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Fine } from '../entities/fine.entity';
import { Book } from '../entities/book.entity';
import { BookCopy } from '../entities/copy.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(
    @InjectRepository(Transaction) private readonly txnRepo: Repository<Transaction>,
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  private requireStaff(req: any) {
    const { role } = req.user;
    if (!['librarian', 'coordinator', 'admin', 'super_admin'].includes(role)) {
      throw new ForbiddenException('Access restricted to staff');
    }
  }

  /** GET /reports/kpis — executive summary KPIs */
  @Get('kpis')
  async getKpis(@Req() req: any) {
    this.requireStaff(req);

    const [
      totalBooks,
      totalCopies,
      availableCopies,
      activeLoans,
      overdueLoans,
      totalFinesUnpaid,
      totalFinesPaid,
      totalUsers,
      pendingRequests,
    ] = await Promise.all([
      this.bookRepo.count(),
      this.copyRepo.count(),
      this.copyRepo.count({ where: { status: 'AVAILABLE' } }),
      this.txnRepo.count({ where: { status: 'ACTIVE' } }),
      this.txnRepo.count({ where: { status: 'OVERDUE' } }),
      this.fineRepo
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount - f.waivedAmount), 0)', 'total')
        .where("f.status = 'UNPAID' OR f.status = 'PARTIALLY_WAIVED'")
        .getRawOne()
        .then((r) => parseFloat(r?.total ?? '0')),
      this.fineRepo
        .createQueryBuilder('f')
        .select('COALESCE(SUM(f.amount - f.waivedAmount), 0)', 'total')
        .where("f.status = 'PAID'")
        .getRawOne()
        .then((r) => parseFloat(r?.total ?? '0')),
      this.userRepo.count({ where: { isActive: true } }),
      this.txnRepo.count({ where: { status: 'ACTIVE' } }), // placeholder for requests pending
    ]);

    return {
      catalog: {
        totalTitles: totalBooks,
        totalCopies,
        availableCopies,
        issuedCopies: totalCopies - availableCopies,
      },
      circulation: {
        activeLoans,
        overdueLoans,
        overdueRate: activeLoans + overdueLoans > 0
          ? Math.round((overdueLoans / (activeLoans + overdueLoans)) * 100)
          : 0,
      },
      fines: {
        unpaidAmount: totalFinesUnpaid,
        collectedAmount: totalFinesPaid,
      },
      users: {
        totalActive: totalUsers,
      },
    };
  }

  /** GET /reports/overdue — all overdue books */
  @Get('overdue')
  async getOverdueLoans(@Req() req: any) {
    this.requireStaff(req);

    const loans = await this.txnRepo.find({
      where: { status: 'OVERDUE' },
      relations: { copy: { book: true }, user: true },
      order: { dueAt: 'ASC' },
    });

    const now = new Date();
    return loans.map((l) => ({
      ...l,
      daysOverdue: Math.ceil((now.getTime() - new Date(l.dueAt).getTime()) / (24 * 60 * 60 * 1000)),
      estimatedFine: Math.ceil((now.getTime() - new Date(l.dueAt).getTime()) / (24 * 60 * 60 * 1000))
        * (l.copy?.book?.finePerDay ?? 5),
    }));
  }

  /** GET /reports/activity?months=6 — monthly issue/return trend */
  @Get('activity')
  async getActivityTrend(@Req() req: any, @Query('months') months = '6') {
    this.requireStaff(req);

    const numMonths = Math.min(parseInt(months) || 6, 12);
    const result: { month: string; issued: number; returned: number }[] = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const [issued, returned] = await Promise.all([
        this.txnRepo
          .createQueryBuilder('t')
          .where('t.issuedAt >= :start AND t.issuedAt <= :end', { start: startOfMonth, end: endOfMonth })
          .getCount(),
        this.txnRepo
          .createQueryBuilder('t')
          .where("t.returnedAt >= :start AND t.returnedAt <= :end AND t.status = 'RETURNED'", {
            start: startOfMonth,
            end: endOfMonth,
          })
          .getCount(),
      ]);

      result.push({
        month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        issued,
        returned,
      });
    }

    return result;
  }

  /** GET /reports/top-books?limit=10 — most-borrowed books */
  @Get('top-books')
  async getTopBooks(@Req() req: any, @Query('limit') limit = '10') {
    this.requireStaff(req);

    const topBooks = await this.txnRepo
      .createQueryBuilder('t')
      .select('t.copyId', 'copyId')
      .addSelect('COUNT(t.id)', 'borrowCount')
      .groupBy('t.copyId')
      .orderBy('borrowCount', 'DESC')
      .limit(parseInt(limit) || 10)
      .getRawMany();

    const enriched = await Promise.all(
      topBooks.map(async (row) => {
        const copy = await this.copyRepo.findOne({
          where: { id: row.copyId },
          relations: { book: true },
        });
        return {
          bookTitle: copy?.book?.title ?? 'Unknown',
          bookId: copy?.bookId,
          copyBarcode: copy?.barcode,
          borrowCount: parseInt(row.borrowCount),
        };
      }),
    );

    // Deduplicate by bookId, summing borrow counts
    const bookMap = new Map<string, { bookTitle: string; borrowCount: number }>();
    enriched.forEach((row) => {
      const existing = bookMap.get(row.bookId ?? row.copyBarcode ?? '');
      if (existing) {
        existing.borrowCount += row.borrowCount;
      } else {
        bookMap.set(row.bookId ?? '', { bookTitle: row.bookTitle, borrowCount: row.borrowCount });
      }
    });

    return Array.from(bookMap.entries())
      .map(([id, v]) => ({ bookId: id, ...v }))
      .sort((a, b) => b.borrowCount - a.borrowCount);
  }

  /** GET /reports/audit?limit=50 — recent audit log */
  @Get('audit')
  async getAuditLog(@Req() req: any, @Query('limit') limit = '50') {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins can view the audit log');
    }

    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(parseInt(limit) || 50, 200),
    });
  }
}
