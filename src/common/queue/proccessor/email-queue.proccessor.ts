import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from 'src/common/email/email.service';

export interface EmailJobData {
  type: string;
  to: string;
  shipmentId?: number;
  amount?: number;
  paymentUrl?: string;
  expiryDate?: Date | string;
  trackingNumber?: string;
}

@Processor('email-queue')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async processEmailJob(job: Job<EmailJobData>) {
    const { data } = job;
    const { type, to, shipmentId, amount, paymentUrl, expiryDate } = data;
    this.logger.log(`Processing email job of type ${type} for recipient ${to}`);
    // Implement email sending logic based on the type

    try {
      switch (type) {
        case 'testing':
          await this.emailService.testingEmail(to);
          this.logger.log(`Email of type ${type} sent successfully to ${to}`);
          break;
        case 'payment-notification': {
          const normalizedExpiryDate =
            typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
          await this.emailService.sendEmailPaymentNotification(
            to,
            paymentUrl || ' ',
            shipmentId || 0,
            amount || 0,
            normalizedExpiryDate || new Date(),
          );
          this.logger.log(`Email of type ${type} sent successfully to ${to}`);
          break;
        }
        case 'payment-success':
          await this.emailService.sendPaymentSuccess(
            to,
            shipmentId || 0,
            amount || 0,
            data.trackingNumber,
          );
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
