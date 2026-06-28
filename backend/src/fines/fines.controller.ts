import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fine } from '../entities/fine.entity';
import { Payment } from '../entities/payment.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('fines')
@UseGuards(JwtGuard)
export class FinesController {
  constructor(
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /** GET /fines/my-fines — student's own fines */
  @Get('my-fines')
  async getMyFines(@Req() req: any) {
    const userId = req.user.id;
    const fines = await this.fineRepo.find({
      where: { userId },
      relations: { transaction: { copy: { book: true } } },
      order: { createdAt: 'DESC' },
    });

    return fines.map((f) => ({
      ...f,
      netAmount: Number(f.amount) - Number(f.waivedAmount),
    }));
  }

  /** GET /fines — all fines, librarian/admin/coordinator only, or student own fines */
  @Get()
  async getAllFines(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const user = req.user;
    const where: any = {};

    if (user.role === 'student') {
      where.userId = user.id;
    } else {
      if (!['librarian', 'admin', 'super_admin', 'coordinator'].includes(user.role)) {
        throw new ForbiddenException('Access denied');
      }
      if (userId) where.userId = userId;
    }

    if (status) where.status = status;

    const fines = await this.fineRepo.find({
      where: Object.keys(where).length ? where : undefined,
      relations: { user: true, transaction: { copy: { book: true } } },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    return fines.map((f) => ({
      ...f,
      netAmount: Number(f.amount) - Number(f.waivedAmount),
    }));
  }

  /** POST /fines/collect/:fineId — librarian marks fine as paid */
  @Post('collect/:fineId')
  async collectFine(@Param('fineId') fineId: string, @Body() body: any, @Req() req: any) {
    const librarian = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(librarian.role)) {
      throw new ForbiddenException('Only librarians can collect fines');
    }

    const fine = await this.fineRepo.findOne({ where: { id: fineId } });
    if (!fine) throw new NotFoundException('Fine not found');
    if (fine.status === 'PAID' || fine.status === 'FULLY_WAIVED') {
      throw new BadRequestException(`Fine is already ${fine.status}`);
    }

    const amountDue = Number(fine.amount) - Number(fine.waivedAmount);
    const amountPaid = body.amount ? parseFloat(body.amount) : amountDue;
    const txnUserId = fine.userId; // capture before any mutation

    if (amountPaid < amountDue) {
      throw new BadRequestException(`Amount paid (₹${amountPaid}) is less than amount due (₹${amountDue.toFixed(2)})`);
    }

    fine.status = 'PAID';
    await this.fineRepo.save(fine);

    // Create payment record (matches Payment entity fields)
    const payment = this.paymentRepo.create({
      fineId: fine.id,
      userId: txnUserId,
      collectedById: librarian.id,
      amount: amountDue,
      currency: 'INR',
      mode: body.mode ?? 'OFFLINE',    // 'ONLINE' | 'OFFLINE'
      gateway: body.gateway ?? null,
      status: 'SUCCESS',
      paidAt: new Date(),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Audit log
    await this.auditRepo.save({
      actorId: librarian.id,
      action: 'FINE_COLLECTED',
      entityType: 'Fine',
      entityId: fine.id,
      newValue: JSON.stringify({ amount: amountDue, mode: payment.mode }),
    });

    return { message: 'Fine collected successfully', payment: savedPayment };
  }

  /** POST /fines/waive/:fineId — librarian applies waiver */
  @Post('waive/:fineId')
  async waiveFine(@Param('fineId') fineId: string, @Body() body: any, @Req() req: any) {
    const librarian = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(librarian.role)) {
      throw new ForbiddenException('Only librarians and admins can waive fines');
    }

    const fine = await this.fineRepo.findOne({ where: { id: fineId } });
    if (!fine) throw new NotFoundException('Fine not found');
    if (fine.status === 'PAID' || fine.status === 'FULLY_WAIVED') {
      throw new BadRequestException(`Fine is already ${fine.status}`);
    }

    const waiverAmount = body.waiverAmount ? parseFloat(body.waiverAmount) : Number(fine.amount);
    if (waiverAmount <= 0) throw new BadRequestException('Waiver amount must be greater than zero');
    if (waiverAmount > Number(fine.amount)) {
      throw new BadRequestException('Waiver amount cannot exceed the fine amount');
    }

    fine.waivedAmount = waiverAmount;
    fine.waivedById = librarian.id;
    fine.waiverReason = body.reason ?? 'Waiver approved by librarian';
    fine.status = waiverAmount >= Number(fine.amount) ? 'FULLY_WAIVED' : 'PARTIALLY_WAIVED';
    await this.fineRepo.save(fine);

    await this.auditRepo.save({
      actorId: librarian.id,
      action: 'FINE_WAIVED',
      entityType: 'Fine',
      entityId: fine.id,
      newValue: JSON.stringify({ waiverAmount, reason: fine.waiverReason }),
    });

    return {
      message: `Fine ${fine.status === 'FULLY_WAIVED' ? 'fully waived' : 'partially waived'}`,
      fine,
    };
  }
}
