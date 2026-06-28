import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;

  @Column({ default: 'STRING' })
  type: string; // 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'CSV'

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
