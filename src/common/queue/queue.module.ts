import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailService } from '../email/email.service';
import { EmailQueueProcessor } from './proccessor/email-queue.proccessor';
import { PaymentExpiryQueueProcessor } from './proccessor/payment-expired-queue.processor';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    BullModule.registerQueue({
      name: 'ppayment-expired-queue',
    }),
  ],
  controllers: [],
  providers: [
    QueueService,
    EmailService,
    EmailQueueProcessor,
    PaymentExpiryQueueProcessor,
    PrismaService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
