import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BookCopy } from '../entities/copy.entity';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('books')
@UseGuards(JwtGuard)
export class BooksController {
  constructor(
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy) private readonly copyRepo: Repository<BookCopy>,
  ) {}

  /** GET /books?search=&category=&page=1&limit=20 */
  @Get()
  async listBooks(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const searchVal = search || q;
    const isPaginated = page !== undefined || limit !== undefined;

    const take = Math.min(parseInt(limit || '20') || 20, 100);
    const skip = (Math.max(parseInt(page || '1') || 1, 1) - 1) * take;

    const where: FindManyOptions<Book>['where'] = {};
    if (searchVal) {
      // Search title, authors (in array), category or ISBN
      const searchOptions: FindManyOptions<Book>['where'] = [
        { title: ILike(`%${searchVal}%`) },
        { categoryId: ILike(`%${searchVal}%`) },
        { isbn: ILike(`%${searchVal}%`) },
      ];
      
      const books = await this.bookRepo.find({
        where: searchOptions,
        relations: { copies: true },
        take: isPaginated ? take : undefined,
        skip: isPaginated ? skip : undefined,
      });

      const enriched = this.enrichWithCopyCounts(books);
      if (!isPaginated) return enriched;
      return {
        data: enriched,
        total: enriched.length,
        page: 1,
        limit: enriched.length,
      };
    }

    if (category && category !== 'All Categories') where['categoryId'] = ILike(`%${category}%`);
    if (department) where['departmentId'] = ILike(`%${department}%`);

    if (!isPaginated) {
      const books = await this.bookRepo.find({
        where: Object.keys(where).length ? where : undefined,
        relations: { copies: true },
        order: { createdAt: 'DESC' },
      });
      return this.enrichWithCopyCounts(books);
    }

    const [books, total] = await this.bookRepo.findAndCount({
      where: Object.keys(where).length ? where : undefined,
      relations: { copies: true },
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data: this.enrichWithCopyCounts(books),
      total,
      page: parseInt(page || '1') || 1,
      limit: take,
    };
  }

  /** GET /books/:id */
  @Get(':id')
  async getBook(@Param('id') id: string) {
    const book = await this.bookRepo.findOne({
      where: { id },
      relations: { copies: true },
    });
    if (!book) throw new NotFoundException('Book not found');
    const [enriched] = this.enrichWithCopyCounts([book]);
    return enriched;
  }

  /** GET /books/:id/copies */
  @Get(':id/copies')
  async getCopies(@Param('id') id: string) {
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return this.copyRepo.find({ where: { bookId: id }, order: { copyNumber: 'ASC' } });
  }

  /** POST /books — librarian/admin only */
  @Post()
  async createBook(@Body() body: any, @Req() req: any) {
    const user = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only librarians and admins can add books');
    }
    if (!body.isbn || !body.title || !body.authors) {
      throw new BadRequestException('isbn, title, and authors are required');
    }

    const existing = await this.bookRepo.findOne({ where: { isbn: body.isbn } });
    if (existing) throw new BadRequestException('A book with this ISBN already exists');

    const book = this.bookRepo.create({
      isbn: body.isbn,
      title: body.title,
      authors: Array.isArray(body.authors) ? body.authors : [body.authors],
      publisher: body.publisher,
      edition: body.edition,
      publicationYear: body.publicationYear,
      categoryId: body.categoryId || 'General',
      departmentId: body.departmentId,
      coverImageUrl: body.coverImageUrl,
      description: body.description,
      finePerDay: body.finePerDay ?? 5.00,
      maxIssueDays: body.maxIssueDays ?? 14,
      maxRenewals: body.maxRenewals ?? 2,
      replacementCost: body.replacementCost,
      isDigitalAvailable: body.isDigitalAvailable ?? false,
      drmPolicy: body.drmPolicy ?? 'BORROW_ONLY',
    });
    return this.bookRepo.save(book);
  }

  /** PATCH /books/:id */
  @Patch(':id')
  async updateBook(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only librarians and admins can update books');
    }
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    Object.assign(book, body);
    return this.bookRepo.save(book);
  }

  /** POST /books/:id/copies — add a physical copy */
  @Post(':id/copies')
  async addCopy(@Param('id') bookId: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    if (!['librarian', 'admin', 'super_admin'].includes(user.role)) {
      throw new ForbiddenException('Only librarians and admins can add copies');
    }
    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    if (!body.barcode) throw new BadRequestException('barcode is required');

    const existing = await this.copyRepo.findOne({ where: { barcode: body.barcode } });
    if (existing) throw new BadRequestException('Barcode already exists');

    const existingCopies = await this.copyRepo.find({ where: { bookId } });
    const copyNumber = `COP-${existingCopies.length + 1}`;

    const copy = this.copyRepo.create({
      bookId,
      barcode: body.barcode,
      copyNumber: body.copyNumber ?? copyNumber,
      condition: body.condition ?? 'GOOD',
      locationShelf: body.locationShelf,
      locationRack: body.locationRack,
      status: 'AVAILABLE',
      acquiredDate: body.acquiredDate ? new Date(body.acquiredDate) : new Date(),
    });
    return this.copyRepo.save(copy);
  }

  // Helper: annotate books with availability counts
  private enrichWithCopyCounts(books: Book[]) {
    return books.map((book) => {
      const copies = book.copies ?? [];
      return {
        ...book,
        totalCopies: copies.length,
        availableCopies: copies.filter((c) => c.status === 'AVAILABLE').length,
        copies: undefined, // don't send raw copies in list view
      };
    });
  }
}
