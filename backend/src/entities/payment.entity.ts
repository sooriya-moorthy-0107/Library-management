import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Fine } from './fine.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fineId: string;

  @ManyToOne(() => Fine, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fineId' })
  fine: Fine;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  collectedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'collectedById' })
  collectedBy: User;

  @Column()
  mode: string; // 'ONLINE' | 'OFFLINE'

  @Column({ nullable: true })
  gateway: string; // 'RAZORPAY' | 'PAYU'

  @Column({ nullable: true })
  gatewayOrderId: string;

  @Column({ nullable: true })
  gatewayPaymentId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ default: 'PENDING' })
  status: string; // 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
