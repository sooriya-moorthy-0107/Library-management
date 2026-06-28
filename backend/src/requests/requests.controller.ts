import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookRequest } from '../entities/request.entity';
import { Book } from '../entities/book.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('requests')
@UseGuards(JwtGuard)
export class RequestsController {
  constructor(
    @InjectRepository(BookRequest) private readonly requestRepo: Repository<BookRequest>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /** GET /requests */
  @Get()
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

  /** POST /requests */
  @Post()
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

  /** PATCH /requests/:id/approve */
  @Patch(':id/approve')
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

    await this.auditRepo.save(this.auditRepo.create({
      actorId: user.id,
      action: 'REQUEST_APPROVED',
      entityType: 'BookRequest',
      entityId: request.id,
      newValue: JSON.stringify({ comment: request.coordinatorComment }),
    }));

    return { message: 'Request approved and queued for collection', request };
  }

  /** PATCH /requests/:id/reject */
  @Patch(':id/reject')
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
