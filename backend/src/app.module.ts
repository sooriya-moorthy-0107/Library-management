import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDbConfig } from './db/db.config';
import { SeedService } from './db/seeds/seed.service';

import { User } from './entities/user.entity';
import { Book } from './entities/book.entity';
import { BookCopy } from './entities/copy.entity';
import { Transaction } from './entities/transaction.entity';
import { BookRequest } from './entities/request.entity';
import { Fine } from './entities/fine.entity';
import { Payment } from './entities/payment.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SystemSetting } from './entities/setting.entity';
import { NoDueCertificate } from './entities/certificate.entity';

import { AuthController } from './auth/auth.controller';
import { BooksController } from './books/books.controller';
import { CirculationController } from './circulation/circulation.controller';
import { FinesController } from './fines/fines.controller';
import { ReportsController } from './reports/reports.controller';
import { SettingsController } from './settings/settings.controller';
import { RequestsController } from './requests/requests.controller';
import { PaymentsController } from './payments/payments.controller';
import { CertificatesController } from './certificates/certificates.controller';
import { VerifyController } from './verify/verify.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => await getDbConfig(),
    }),
    TypeOrmModule.forFeature([
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
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    BooksController,
    CirculationController,
    FinesController,
    ReportsController,
    SettingsController,
    RequestsController,
    PaymentsController,
    CertificatesController,
    VerifyController,
  ],
  providers: [AppService, SeedService],
})
export class AppModule {}


