import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { EmailJobData } from './proccessor/email-queue.proccessor';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async addEmailJob(
    data: EmailJobData,
    options?: { delay?: number; attempts?: number },
  ) {
    return await this.emailQueue.add('send-email', data, {
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      removeOnComplete: true,
      removeOnFail: true,
      backoff: { type: 'exponential', delay: options?.delay || 1000 },
    });
  }
}
