import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';
import { PrismaService } from 'src/common/prisma/prisma.service';

export interface PaymentExpiredJobData {
  paymentId: number;
  shipmentId: number;
  externalId: string;
}

@Processor('ppayment-expired-queue')
@Injectable()
export class PaymentExpiryQueueProcessor {
  private readonly logger = new Logger(PaymentExpiryQueueProcessor.name);
  constructor(private readonly prisma: PrismaService) {}

  @Process('expire-payment')
  async handleExpiredPayment(job: Job<PaymentExpiredJobData>) {
    const { data } = job;
    this.logger.debug(
      `Processing expired payment for shipment ID: ${data.shipmentId}, payment ID: ${data.paymentId}`,
    );

    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: data.paymentId },
        include: {
          shipment: {
            include: {
              shipmentDetails: {
                include: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        this.logger.warn(
          `Payment not found for shipment ID: ${data.shipmentId}, payment ID: ${data.paymentId}`,
        );
        return;
      }

      if (payment.status !== PaymentStatus.PENDING) {
        this.logger.warn(
          `Payment status is not pending for shipment ID: ${data.shipmentId}, payment ID: ${data.paymentId}. Current status: ${payment.status}`,
        );
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: data.paymentId },
          data: { status: PaymentStatus.EXPIRED },
        });

        await tx.shipment.update({
          where: { id: data.shipmentId },
          data: { paymentStatus: PaymentStatus.EXPIRED },
        });

        await tx.shipmentHistory.create({
          data: {
            shipmentId: data.shipmentId,
            status: PaymentStatus.EXPIRED,
            description: 'Payment expired - automatic expiry',
          },
        });
      });

      this.logger.log(
        `Successfully processed expired payment for shipment ID: ${data.shipmentId}, payment ID: ${data.paymentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error occurred while processing expired payment for shipment ID: ${data.shipmentId}, payment ID: ${data.paymentId}`,
        error,
      );
      throw error;
    }
  }
}
