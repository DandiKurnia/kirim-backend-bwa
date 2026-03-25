import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailService } from '../email/email.service';
import { EmailQueueProcessor } from './proccessor/email-queue.proccessor';

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
  ],
  controllers: [],
  providers: [QueueService, EmailService, EmailQueueProcessor],
  exports: [QueueService],
})
export class QueueModule {}
