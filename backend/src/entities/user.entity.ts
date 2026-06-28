import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({ nullable: true, unique: true })
  studentId: string;

  @Column()
  role: string; // 'super_admin' | 'admin' | 'librarian' | 'coordinator' | 'student'

  @Column({ nullable: true })
  departmentId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'en' })
  preferredLanguage: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column({ default: 0 })
  failedLoginCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
