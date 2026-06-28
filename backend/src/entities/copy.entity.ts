import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Book } from './book.entity';

@Entity('book_copies')
export class BookCopy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookId: string;

  @ManyToOne(() => Book, (book) => book.copies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  copyNumber: string;

  @Column({ unique: true })
  barcode: string;

  @Column({ default: 'GOOD' })
  condition: string; // 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'

  @Column({ nullable: true })
  locationShelf: string;

  @Column({ nullable: true })
  locationRack: string;

  @Column({ default: 'AVAILABLE' })
  status: string; // 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST'

  @Column({ type: 'date', nullable: true })
  acquiredDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
