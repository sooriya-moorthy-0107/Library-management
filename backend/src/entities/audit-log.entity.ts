import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actorId: string; // The user ID who performed the action

  @Column()
  action: string; // e.g. 'BOOK_ISSUED', 'FINE_WAIVED', 'LOGIN_FAILED'

  @Column()
  entityType: string; // e.g. 'Transaction', 'Fine', 'User'

  @Column()
  entityId: string; // The ID of the modified entity

  @Column({ type: 'text', nullable: true })
  oldValue: string; // JSON string of old state

  @Column({ type: 'text', nullable: true })
  newValue: string; // JSON string of new state

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
