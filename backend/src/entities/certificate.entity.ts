import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('no_due_certificates')
export class NoDueCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  isValid: boolean;

  @Column({ nullable: true })
  revokedById: string;

  @Column({ nullable: true })
  revocationReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
