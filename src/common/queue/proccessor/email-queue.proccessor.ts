import { Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from 'src/common/email/email.service';

export interface EmailJobData {
  type: string;
  to: string;
}

@Processor('email-queue')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly EmailService: EmailService) {}

  async processEmailJob(job: Job<EmailJobData>) {
    const { data } = job;
    const { type, to } = data;
    this.logger.log(`Processing email job of type ${type} for recipient ${to}`);
    // Implement email sending logic based on the type

    try {
      switch (type) {
        case 'testing':
          await this.EmailService.testingEmail(to);
          this.logger.log(`Email of type ${type} sent successfully to ${to}`);
          break;
        default:
          this.logger.warn(`Unknown email job type: ${type}`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to process email job of type ${type} for recipient ${to}: ${error}`,
      );
      throw error;
    }
  }
}
