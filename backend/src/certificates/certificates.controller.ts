import {
  Controller, Get, Post, UseGuards, Req, BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoDueCertificate } from '../entities/certificate.entity';
import { Transaction } from '../entities/transaction.entity';
import { Fine } from '../entities/fine.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('certificates')
@UseGuards(JwtGuard)
export class CertificatesController {
  constructor(
    @InjectRepository(NoDueCertificate) private readonly certRepo: Repository<NoDueCertificate>,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Fine) private readonly fineRepo: Repository<Fine>,
  ) {}

  /** GET /certificates/no-due */
  @Get('no-due')
  async getMyCertificates(@Req() req: any) {
    return this.certRepo.find({
      where: { userId: req.user.id },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** POST /certificates/no-due */
  @Post('no-due')
  async generateCertificate(@Req() req: any) {
    const userId = req.user.id;

    // Check active checkouts
    const activeCheckouts = await this.transactionRepo.count({
      where: [
        { userId, status: 'ACTIVE' },
        { userId, status: 'OVERDUE' },
      ],
    });
    if (activeCheckouts > 0) {
      throw new BadRequestException(`Cannot generate No Due Certificate: you have ${activeCheckouts} active book loans outstanding.`);
    }

    // Check unpaid fines
    const unpaidFines = await this.fineRepo.count({
      where: { userId, status: 'UNPAID' },
    });
    if (unpaidFines > 0) {
      throw new BadRequestException('Cannot generate No Due Certificate: you have unpaid overdue fines.');
    }

    // Create NDC
    const cert = this.certRepo.create({
      userId,
      isValid: true,
    });
    const saved = await this.certRepo.save(cert);

    // Reload with user details
    return this.certRepo.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });
  }
}
