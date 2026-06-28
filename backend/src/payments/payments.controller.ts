import {
  Controller, Get, Post, Body, Param, UseGuards, Req, NotFoundException, BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Fine } from '../entities/fine.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) { }

  /** POST /payments/initiate */
  @Post('initiate')
  async initiatePayment(@Body() body: any, @Req() req: any) {
    const user = req.user;
    const { fineId } = body;
    if (!fineId) throw new BadRequestException('fineId is required');

    const fine = await this.fineRepo.findOne({
      where: { id: fineId },
      relations: { transaction: { copy: { book: true } } },
    });
    if (!fine) throw new NotFoundException('Fine record not found');
    if (fine.status === 'PAID' || fine.status === 'FULLY_WAIVED') {
      throw new BadRequestException('Fine is already cleared');
    }

    const netAmount = Number(fine.amount) - Number(fine.waivedAmount);

    // Create payment
    const payment = this.paymentRepo.create({
      fineId: fine.id,
      userId: user.id,
      amount: netAmount,
      currency: 'INR',
      mode: 'ONLINE',
      gateway: 'RAZORPAY',
      status: 'SUCCESS',
      paidAt: new Date(),
    });
    const saved = await this.paymentRepo.save(payment);

    // Update Fine
    fine.status = 'PAID';
    await this.fineRepo.save(fine);

    // Audit log
    await this.auditRepo.save(this.auditRepo.create({
      actorId: user.id,
      action: 'FINE_PAID_ONLINE',
      entityType: 'Fine',
      entityId: fine.id,
      newValue: JSON.stringify({ amount: netAmount, paymentId: saved.id }),
    }));

    return {
      message: 'Payment authorized and settled successfully',
      payment: saved,
    };
  }

  /** GET /payments/:paymentId/receipt */
  @Get(':paymentId/receipt')
  async getReceipt(@Param('paymentId') paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: {
        user: true,
        fine: {
          transaction: {
            copy: {
              book: true
            }
          }
        }
      },
    });

    if (!payment) throw new NotFoundException('Payment record not found');

    return {
      receipt: {
        receiptNumber: `REC-${payment.id.substring(0, 8).toUpperCase()}`,
        studentName: payment.user.fullName,
        bookTitle: payment.fine?.transaction?.copy?.book?.title ?? 'Library Item',
        barcode: payment.fine?.transaction?.copy?.barcode ?? 'N/A',
        amount: payment.amount,
        paymentMode: payment.mode,
      },
    };
  }
}
