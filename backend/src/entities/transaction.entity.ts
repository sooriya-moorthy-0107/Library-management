import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BookCopy } from './copy.entity';
import { User } from './user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  copyId: string;

  @ManyToOne(() => BookCopy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'copyId' })
  copy: BookCopy;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  issuedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'issuedById' })
  issuedBy: User;

  @Column({ nullable: true })
  returnedToId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'returnedToId' })
  returnedTo: User;

  @Column({ type: 'datetime' })
  issuedAt: Date;

  @Column({ type: 'datetime' })
  dueAt: Date;

  @Column({ type: 'datetime', nullable: true })
  returnedAt: Date;

  @Column({ type: 'smallint', default: 0 })
  renewedCount: number;

  @Column({ default: 'ACTIVE' })
  status: string; // 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST'

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
