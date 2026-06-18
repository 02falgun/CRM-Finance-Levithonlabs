import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from './pdf.service';
import { MailService } from './mail.service';
import { EbillingService, MockIrdClient } from './ebilling.service';
import { EbillingController } from './ebilling.controller';
import { IntegrationController } from './integration.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [PdfService, MailService, EbillingService, MockIrdClient],
  controllers: [EbillingController, IntegrationController],
  exports: [PdfService, MailService, EbillingService],
})
export class IntegrationModule {}
