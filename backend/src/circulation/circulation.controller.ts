import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { BookCopy } from '../entities/copy.entity';
import { BookRequest } from '../entities/request.entity';
import { Fine } from '../entities/fine.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { Book } from '../entities/book.entity';
import { JwtGuard } from '../auth/jwt.guard';
import { SystemSetting } from '../entities/setting.entity';

@Controller('circulation')
@UseGuards(JwtGuard)
export class CirculationController {
  constructor(
    @InjectRepository(Transaction) private readonly txnRepo: Repository<Transaction>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
    @InjectRepository(BookRequest) private readonly requestRepo: Repository<BookRequest>,
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(SystemSetting) private readonly settingRepo: Repository<SystemSetting>,
  ) {}

  // ─── Loans ─────────────────────────────────────────────────────────────────

  /** GET /circulation/my-loans — student's own active/overdue loans */
  @Get('my-loans')
  async getMyLoans(@Req() req: any) {
    const userId = req.user.id;
    return this.txnRepo.find({
      where: [
        { userId, status: 'ACTIVE' },
        { userId, status: 'OVERDUE' },
      ],
      relations: { copy: { book: true } },
      order: { dueAt: 'ASC' },
    });
  }

  /** GET /circulation/active — all active/overdue loans with user & book relations */
  @Get('active')
  async getActiveLoans() {
    return this.txnRepo.find({
      where: [
        { status: 'ACTIVE' },
        { status: 'OVERDUE' },
      ],
      relations: { copy: { book: true }, user: true },
      order: { dueAt: 'ASC' },
    });
  }

  /** GET /circulation/loans — all loans for librarian/admin */
  @Get('loans')
  async getAllLoans(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const user = req.user;
    if (!['librarian', 'admin', 'super_admin', 'coordinator'].includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    return this.txnRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { copy: { book: true }, user: true },
      order: { dueAt: 'ASC' },
      take: 100,
    });
  }

  /** POST /circulation/issue — librarian issues a book to a student */
  @Post('issue')
  async issueBook(@Body() body: any, @Req() req: any) {
    const librarian = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(librarian.role)) {
      throw new ForbiddenException('Only librarians can issue books');
    }

    const { barcode, userId, studentId } = body;
    const searchId = userId || studentId;
    if (!barcode || !searchId) throw new BadRequestException('barcode and studentId/userId are required');

    // Check borrower exists by studentId or UUID id
    let borrower = await this.userRepo.findOne({ where: { studentId: searchId } });
    if (!borrower) {
      borrower = await this.userRepo.findOne({ where: { id: searchId } });
    }
    if (!borrower) throw new NotFoundException('User not found');

    // Check copy availability
    const copy = await this.copyRepo.findOne({ where: { barcode }, relations: { book: true } });
    if (!copy) throw new NotFoundException(`Copy with barcode ${barcode} not found`);
    if (copy.status !== 'AVAILABLE') {
      throw new BadRequestException(`Copy is currently ${copy.status} and cannot be issued`);
    }

    // Check if borrower has unpaid fines
    const unpaidFines = await this.fineRepo.find({ where: { userId: borrower.id, status: 'UNPAID' } });
    if (unpaidFines.length > 0) {
      throw new BadRequestException('User has unpaid fines. Please clear dues before issuing new books.');
    }

    // Check max books setting
    const maxBooksSetting = await this.settingRepo.findOne({ where: { key: 'max_books_per_student' } });
    const maxBooks = maxBooksSetting ? parseInt(maxBooksSetting.value) : 3;
    const activeLoans = await this.txnRepo.count({
      where: [{ userId: borrower.id, status: 'ACTIVE' }, { userId: borrower.id, status: 'OVERDUE' }],
    });
    if (activeLoans >= maxBooks) {
      throw new BadRequestException(`User has reached the maximum limit of ${maxBooks} borrowed books`);
    }

    // Determine loan duration
    const loanDaysSetting = await this.settingRepo.findOne({ where: { key: 'default_loan_days' } });
    const loanDays = copy.book?.maxIssueDays ?? (loanDaysSetting ? parseInt(loanDaysSetting.value) : 14);

    const now = new Date();
    const dueAt = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);

    // Create transaction
    const txn = this.txnRepo.create({
      copyId: copy.id,
      userId: borrower.id,
      issuedById: librarian.id,
      issuedAt: now,
      dueAt,
      status: 'ACTIVE',
    });
    const saved = await this.txnRepo.save(txn);

    // Mark copy as issued
    await this.copyRepo.update(copy.id, { status: 'ISSUED' });

    // Audit log
    await this.auditRepo.save(this.auditRepo.create({
      actorId: librarian.id,
      action: 'BOOK_ISSUED',
      entityType: 'Transaction',
      entityId: saved.id,
      newValue: JSON.stringify({ barcode, borrower: borrower.fullName, dueAt }),
    }));

    return {
      message: 'Book issued successfully',
      dueDate: dueAt, // Make sure frontend reads dueDate
      transaction: { ...saved, dueAt, copy: { barcode: copy.barcode, book: { title: copy.book?.title } } },
    };
  }

  /** POST /circulation/return — librarian processes a return */
  @Post('return')
  async returnBook(@Body() body: any, @Req() req: any) {
    const librarian = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(librarian.role)) {
      throw new ForbiddenException('Only librarians can process returns');
    }

    const { barcode, condition, conditionNotes } = body;
    const bookCondition = condition || conditionNotes || 'GOOD';
    if (!barcode) throw new BadRequestException('barcode is required');

    const copy = await this.copyRepo.findOne({ where: { barcode }, relations: { book: true } });
    if (!copy) throw new NotFoundException(`Copy with barcode ${barcode} not found`);

    // Find the active transaction
    const txns = await this.txnRepo.find({
      where: [
        { copyId: copy.id, status: 'ACTIVE' },
        { copyId: copy.id, status: 'OVERDUE' },
      ],
      relations: { user: true },
    });
    const txn = txns[0];
    if (!txn) throw new NotFoundException('No active loan found for this copy');

    const now = new Date();
    const isOverdue = now > txn.dueAt;
    let fineCreated: Fine | null = null;

    if (isOverdue) {
      const daysOverdue = Math.ceil((now.getTime() - txn.dueAt.getTime()) / (24 * 60 * 60 * 1000));
      const finePerDay = copy.book?.finePerDay ?? 5;
      const fineAmount = daysOverdue * finePerDay;

      fineCreated = await this.fineRepo.save(this.fineRepo.create({
        transactionId: txn.id,
        userId: txn.userId,
        fineType: 'OVERDUE',
        amount: fineAmount,
        waivedAmount: 0,
        status: 'UNPAID',
      }));
    }

    // Handle damage fine
    if (bookCondition && bookCondition !== 'GOOD' && bookCondition !== copy.condition) {
      await this.fineRepo.save(this.fineRepo.create({
        transactionId: txn.id,
        userId: txn.userId,
        fineType: 'DAMAGE',
        amount: (copy.book?.replacementCost ?? 500) * 0.3,
        waivedAmount: 0,
        status: 'UNPAID',
      }));
    }

    // Update transaction
    txn.status = 'RETURNED';
    txn.returnedAt = now;
    txn.returnedToId = librarian.id;
    await this.txnRepo.save(txn);

    // Free the copy
    await this.copyRepo.update(copy.id, {
      status: 'AVAILABLE',
      condition: bookCondition,
    });

    // Audit
    await this.auditRepo.save(this.auditRepo.create({
      actorId: librarian.id,
      action: 'BOOK_RETURNED',
      entityType: 'Transaction',
      entityId: txn.id,
      newValue: JSON.stringify({ barcode, isOverdue, fineAmount: fineCreated?.amount ?? 0 }),
    }));

    return {
      message: 'Book returned successfully',
      isOverdue,
      fine: fineCreated,
    };
  }

  /** POST /circulation/renew/:txnId — student self-service renewal */
  @Post('renew/:txnId')
  async renewLoan(@Param('txnId') txnId: string, @Req() req: any) {
    const userId = req.user.id;

    const txn = await this.txnRepo.findOne({
      where: { id: txnId },
      relations: { copy: { book: true } },
    });
    if (!txn) throw new NotFoundException('Transaction not found');

    // Students can only renew their own loans; librarians can renew any
    const isStaff = ['librarian', 'admin', 'super_admin'].includes(req.user.role);
    if (!isStaff && txn.userId !== userId) {
      throw new ForbiddenException('You can only renew your own loans');
    }

    if (txn.status === 'RETURNED') throw new BadRequestException('This book has already been returned');

    const maxRenewals = txn.copy?.book?.maxRenewals ?? 2;
    if (txn.renewedCount >= maxRenewals) {
      throw new BadRequestException(`Maximum renewal limit (${maxRenewals}) reached`);
    }

    const loanDays = txn.copy?.book?.maxIssueDays ?? 14;
    const now = new Date();
    const newDueDate = new Date(Math.max(now.getTime(), txn.dueAt.getTime()) + loanDays * 24 * 60 * 60 * 1000);

    txn.dueAt = newDueDate;
    txn.renewedCount += 1;
    txn.status = 'ACTIVE'; // clear overdue if they renew
    await this.txnRepo.save(txn);

    return {
      message: 'Loan renewed successfully',
      newDueAt: newDueDate,
      renewedCount: txn.renewedCount,
    };
  }

  // ─── Requests ──────────────────────────────────────────────────────────────

  /** GET /circulation/requests */
  @Get('requests')
  async listRequests(@Req() req: any, @Query('status') status?: string) {
    const user = req.user;

    if (user.role === 'student') {
      const where: any = { userId: user.id };
      if (status) where.status = status;
      return this.requestRepo.find({
        where,
        relations: { book: true },
        order: { createdAt: 'DESC' },
      });
    }

    const where: any = {};
    if (status) where.status = status;

    return this.requestRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { book: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** POST /circulation/requests — student submits a book request */
  @Post('requests')
  async createRequest(@Body() body: any, @Req() req: any) {
    const user = req.user;
    const { bookId, purpose } = body;
    if (!bookId) throw new BadRequestException('bookId is required');

    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    const existing = await this.requestRepo.findOne({
      where: { bookId, userId: user.id, status: 'PENDING_COORDINATOR' },
    });
    if (existing) throw new BadRequestException('You already have a pending request for this book');

    const request = this.requestRepo.create({
      bookId,
      userId: user.id,
      purpose: purpose ?? '',
      status: 'PENDING_COORDINATOR',
    });
    return this.requestRepo.save(request);
  }

  /** PATCH /circulation/requests/:id/approve */
  @Patch('requests/:id/approve')
  async approveRequest(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    if (!['coordinator', 'librarian', 'admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only coordinators and librarians can approve requests');
    }

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING_COORDINATOR') {
      throw new BadRequestException(`Request is already ${request.status}`);
    }

    request.status = 'QUEUED';
    request.coordinatorComment = body.comment ?? 'Approved';
    await this.requestRepo.save(request);

    await this.auditRepo.save({
      actorId: user.id,
      action: 'REQUEST_APPROVED',
      entityType: 'BookRequest',
      entityId: request.id,
      newValue: JSON.stringify({ comment: request.coordinatorComment }),
    });

    return { message: 'Request approved and queued for collection', request };
  }

  /** PATCH /circulation/requests/:id/reject */
  @Patch('requests/:id/reject')
  async rejectRequest(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    if (!['coordinator', 'librarian', 'admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only coordinators and librarians can reject requests');
    }

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    request.status = 'REJECTED';
    request.coordinatorComment = body.reason ?? 'Rejected by coordinator';
    await this.requestRepo.save(request);

    return { message: 'Request rejected', request };
  }
}
