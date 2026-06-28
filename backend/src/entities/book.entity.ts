import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BookCopy } from './copy.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  isbn: string;

  @Column()
  title: string;

  @Column('simple-array')
  authors: string[];

  @Column({ nullable: true })
  publisher: string;

  @Column({ nullable: true })
  edition: string;

  @Column({ type: 'smallint', nullable: true })
  publicationYear: number;

  @Column({ default: 'en' })
  languageCode: string;

  @Column()
  categoryId: string;

  @Column({ nullable: true })
  departmentId: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, default: 5.00 })
  finePerDay: number;

  @Column({ type: 'smallint', default: 14 })
  maxIssueDays: number;

  @Column({ type: 'smallint', default: 2 })
  maxRenewals: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  replacementCost: number;

  @Column({ default: false })
  isDigitalAvailable: boolean;

  @Column({ default: 'BORROW_ONLY' })
  drmPolicy: string; // 'OPEN' | 'BORROW_ONLY' | 'RESTRICTED'

  @OneToMany(() => BookCopy, (copy) => copy.book)
  copies: BookCopy[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
