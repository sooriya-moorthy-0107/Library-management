import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transactionId: string;

  @ManyToOne(() => Transaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 'OVERDUE' })
  fineType: string; // 'OVERDUE' | 'DAMAGE' | 'LOSS'

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
  waivedAmount: number;

  @Column({ nullable: true })
  waivedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'waivedById' })
  waivedBy: User;

  @Column({ nullable: true })
  waiverReason: string;

  @Column({ default: 'UNPAID' })
  status: string; // 'UNPAID' | 'PAID' | 'PARTIALLY_WAIVED' | 'FULLY_WAIVED'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
