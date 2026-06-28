import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoDueCertificate } from '../entities/certificate.entity';

@Controller('verify')
export class VerifyController {
  constructor(
    @InjectRepository(NoDueCertificate) private readonly certRepo: Repository<NoDueCertificate>,
  ) {}

  /** GET /verify/cert/:certId */
  @Get('cert/:certId')
  async verifyCertificate(@Param('certId') certId: string) {
    const cert = await this.certRepo.findOne({
      where: { id: certId },
      relations: { user: true },
    });

    if (!cert || !cert.isValid) {
      return {
        isValid: false,
        message: 'Certificate not found or has been revoked.',
      };
    }

    return {
      isValid: true,
      certId: cert.id,
      studentName: cert.user.fullName,
      studentId: cert.user.studentId ?? 'N/A',
      issueDate: cert.createdAt,
      message: 'Certificate verified successfully.',
    };
  }
}
