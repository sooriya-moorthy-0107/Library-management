import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Client } from 'pg';
import { join } from 'path';
import { User } from '../entities/user.entity';
import { Book } from '../entities/book.entity';
import { BookCopy } from '../entities/copy.entity';
import { Transaction } from '../entities/transaction.entity';
import { BookRequest } from '../entities/request.entity';
import { Fine } from '../entities/fine.entity';
import { Payment } from '../entities/payment.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { SystemSetting } from '../entities/setting.entity';
import { NoDueCertificate } from '../entities/certificate.entity';

const entities = [
  User,
  Book,
  BookCopy,
  Transaction,
  BookRequest,
  Fine,
  Payment,
  AuditLog,
  SystemSetting,
  NoDueCertificate,
];

export async function getDbConfig(): Promise<TypeOrmModuleOptions> {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const username = process.env.DB_USERNAME || 'lms_app';
  const password = process.env.DB_PASSWORD || 'lms_secure_pass_2026';
  const database = process.env.DB_NAME || 'lumina_lms';
  const databaseUrl = process.env.DATABASE_URL;

  // Use DATABASE_URL if available (Render), otherwise fallback to individual variables
  const clientConfig = databaseUrl 
    ? { connectionString: databaseUrl, connectionTimeoutMillis: 2000 }
    : { host, port, user: username, password, database, connectionTimeoutMillis: 2000 };

  const pgClient = new Client(clientConfig);

  try {
    await pgClient.connect();
    await pgClient.end();
    console.log('Successfully connected to PostgreSQL database. Using PostgreSQL.');
    
    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities,
        synchronize: true,
      };
    }

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities,
      synchronize: true,
    };
  } catch (error) {
    console.warn(
      `PostgreSQL database is unreachable (Error: ${(error as Error).message}). Falling back to local SQLite.`
    );
    return {
      type: 'better-sqlite3' as const,
      database: join(process.cwd(), 'lms_database.sqlite'),
      entities,
      synchronize: true,
    };
  }
}
