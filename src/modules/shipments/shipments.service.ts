import { QrCodeService } from './../../qrcode/qrcode.service';
import { XenditService } from './../../common/xendit/xendit.service';
import { QueueService } from './../../common/queue/queue.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { Shipment } from 'src/generated/prisma/client';
import { getDistance } from 'geolib';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';
import { XenditInvoice } from 'src/common/xendit/xendit.service';
import { XenditWebhookDto } from './dto/xendit-webhook.dto';
import { ShipmentStatus } from 'src/common/enum/shipment-status.enum';
import { PdfService, ShipmentPdfData } from 'src/common/pdf/pdf.service';

type DeliveryType = 'same_day' | 'next_day' | 'regular';

type NormalizedInvoice = {
  id: string | null;
  externalId: string;
  status: string;
  invoiceUrl: string;
  expiryDate: Date;
};

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private openCageService: OpenCageService,
    private xenditService: XenditService,
    private qrCodeService: QrCodeService,
    private pdfService: PdfService,
  ) {}

  async create(createShipmentDto: CreateShipmentDto): Promise<Shipment> {
    const { lat, lng } = await this.openCageService.geocode(
      createShipmentDto.destination_address,
    );

    const userAddress = await this.prisma.userAddress.findFirst({
      where: {
        id: createShipmentDto.pickup_address_id,
      },
      include: { user: true },
    });

    if (!userAddress || !userAddress.latitude || !userAddress.longitude) {
      throw new NotFoundException('Pickup address not found');
    }

    const distance = getDistance(
      {
        latitude: userAddress.latitude,
        longitude: userAddress.longitude,
      },
      {
        latitude: lat,
        longitude: lng,
      },
    );

    const distanceInKm = distance / 1000;

    const shipmentCost = this.calculateShippingCost(
      distanceInKm,
      createShipmentDto.weight,
      createShipmentDto.delivery_type,
    );

    const shipment = await this.prisma.$transaction(async (prisma) => {
      const newShipment = await prisma.shipment.create({
        data: {
          paymentStatus: PaymentStatus.PENDING,
          distance: distanceInKm,
          price: shipmentCost.totalPrice,
        },
      });

      await prisma.shipmentDetail.create({
        data: {
          shipmentId: newShipment.id,
          pickupAddressId: createShipmentDto.pickup_address_id,
          destinationAddress: createShipmentDto.destination_address,
          recipientName: createShipmentDto.recipient_name,
          recipientPhone: createShipmentDto.recipient_phone,
          weight: createShipmentDto.weight,
          packageType: createShipmentDto.package_type,
          deliveryType: createShipmentDto.delivery_type,
          destinationLatitude: lat,
          destinationLongitude: lng,
          basePrice: shipmentCost.basePrice,
          weightPrice: shipmentCost.weightPrice,
          distancePrice: shipmentCost.distancePrice,
          userId: userAddress.userId,
        },
      });
      return newShipment;
    });

    const rawInvoice = await this.xenditService.createInvoice({
      externalID: `INV-${Date.now()}-${shipment.id}`,
      amount: shipmentCost.totalPrice,
      payerEmail: userAddress.user.email,
      description: `Shipment #${shipment.id} from ${userAddress.address} to ${createShipmentDto.destination_address}`,
      successRedirectURL: `${process.env.FRONTEND_URL}/send-package/detail/${shipment.id}`,
      invoiceDuration: 86400,
    });

    const invoice = this.normalizeInvoice(rawInvoice);

    const payment = await this.prisma.$transaction(async (prisma) => {
      const createdPayment = await prisma.payment.create({
        data: {
          shipmentId: shipment.id,
          externalId: invoice.externalId,
          invoiceId: invoice.id,
          status: invoice.status,
          invoiceUrl: invoice.invoiceUrl,
          expiryDate: invoice.expiryDate,
        },
      });

      await prisma.shipmentHistory.create({
        data: {
          shipmentId: shipment.id,
          status: PaymentStatus.PENDING,
          description: `Shipmet created with total price ${shipmentCost.totalPrice} cent`,
        },
      });

      return createdPayment;
    });

    try {
      await this.queueService.addEmailJob({
        type: 'payment-notification',
        to: userAddress.user.email,
        shipmentId: shipment.id,
        amount: shipmentCost.totalPrice,
        paymentUrl: invoice.invoiceUrl,
        expiryDate: invoice.expiryDate,
      });
    } catch (error) {
      console.error(
        `Failed to enqueue email job for shipment ${shipment.id}:`,
        error,
      );
    }

    try {
      await this.queueService.addPaymentExpiryJob(
        {
          paymentId: payment.id,
          shipmentId: shipment.id,
          externalId: invoice.externalId,
        },
        invoice.expiryDate,
      );
    } catch (error) {
      console.error(
        `Failed to enqueue payment expiry job for shipment ${shipment.id}:`,
        error,
      );
    }

    return shipment;
  }

  async handlePaymentWebhook(webhookData: XenditWebhookDto): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { externalId: webhookData.external_id },
      include: {
        shipment: {
          include: {
            shipmentDetails: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with external ID ${webhookData.external_id} not found`,
      );
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: webhookData.status,
          paymentMethod: webhookData.payment_method,
        },
      });

      if (
        webhookData.status === PaymentStatus.PAID ||
        webhookData.status === PaymentStatus.SETTLED
      ) {
        const trackingNumber = `KA${webhookData.id}`;

        let qecodeImagePath: string | null = null;
        try {
          qecodeImagePath =
            await this.qrCodeService.generateQrCode(trackingNumber);
        } catch (error) {
          console.error(
            `Failed to generate QR code for shipment ${payment.shipmentId}:`,
            error,
          );
          throw new BadRequestException(
            `Failed to generate QR code for tracking number ${trackingNumber}`,
          );
        }

        await prisma.shipment.update({
          where: { id: payment.shipmentId },
          data: {
            trackingNumber,
            deliveryStatus: ShipmentStatus.READY_TO_PICKUP,
            paymentStatus: webhookData.status,
            qrCodeImage: qecodeImagePath,
          },
        });

        await prisma.shipmentHistory.create({
          data: {
            shipmentId: payment.shipmentId,
            status: ShipmentStatus.READY_TO_PICKUP,
            description: `Payment ${webhookData.status} for shipment with tracking number ${trackingNumber}`,
            userId: payment.shipment.shipmentDetails?.userId,
          },
        });
      }
    });

    try {
      await this.queueService.cancelPaymentExpiryJob(payment.id);
    } catch (error) {
      console.error(
        `Failed to cancel payment expiry job for payment ${payment.id}:`,
        error,
      );
    }

    try {
      const userEmail = payment.shipment.shipmentDetails?.user.email;
      if (userEmail) {
        await this.queueService.addEmailJob({
          type: 'payment-success',
          to: userEmail,
          shipmentId: payment.shipmentId,
          amount: payment.shipment.price || webhookData.amount,
          trackingNumber: payment.shipment.trackingNumber || undefined,
        });
      }
    } catch (error) {
      console.error(
        `Failed to enqueue payment success email job for shipment ${payment.shipmentId}:`,
        error,
      );
    }
  }

  private normalizeDeliveryType(deliveryType: string): DeliveryType {
    if (deliveryType === 'same_day' || deliveryType === 'next_day') {
      return deliveryType;
    }

    return 'regular';
  }

  findAll(userId: number): Promise<Shipment[]> {
    return this.prisma.shipment.findMany({
      where: {
        shipmentDetails: {
          userId,
        },
      },
      include: {
        shipmentDetails: true,
        payment: true,
        shipmentHistories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        shipmentDetails: true,
        payment: true,
        shipmentHistories: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    return shipment;
  }

  private calculateShippingCost(
    distance: number,
    weight: number,
    deliveryType: string,
  ): {
    totalPrice: number;
    basePrice: number;
    weightPrice: number;
    distancePrice: number;
  } {
    const normalizedType = this.normalizeDeliveryType(deliveryType);

    const baseRates: Record<DeliveryType, number> = {
      same_day: 15000,
      next_day: 10000,
      regular: 5000,
    };

    const weightRates: Record<DeliveryType, number> = {
      same_day: 8000,
      next_day: 12000,
      regular: 15000,
    };

    const distanceTierRates: Record<
      DeliveryType,
      { tier1: number; tier2: number; tier3: number }
    > = {
      same_day: {
        tier1: 8000, // 0-10 km
        tier2: 12000, // 10-50 km
        tier3: 15000, // 50+ km
      },
      next_day: {
        tier1: 6000, // 0-10 km
        tier2: 9000, // 10-50 km
        tier3: 12000, // 50+ km
      },
      regular: {
        tier1: 4000, // 0-10 km
        tier2: 6000, // 10-50 km
        tier3: 8000, // 50+ km
      },
    };

    const basePrice = baseRates[normalizedType];
    const weightRate = weightRates[normalizedType];
    const distanceRates = distanceTierRates[normalizedType];

    const weightKg = Math.ceil(weight / 1000);
    const weightPrice = weightKg * weightRate;

    let distancePrice = 0;

    if (distance <= 50) {
      distancePrice = distanceRates.tier1;
    } else if (distance <= 100) {
      distancePrice = distanceRates.tier1 + distanceRates.tier2;
    } else {
      const extraDistance = Math.ceil((distance - 100) / 50);
      distancePrice = distanceRates.tier3 + extraDistance * distanceRates.tier3;
    }

    const totalPrice = basePrice + weightPrice + distancePrice;
    const minimumPrice = 10000;
    const finalPrice = Math.max(totalPrice, minimumPrice);

    return {
      totalPrice: finalPrice,
      basePrice,
      weightPrice,
      distancePrice,
    };
  }

  async generateShipmentPdf(shipmentId: number): Promise<Buffer> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        shipmentDetails: {
          include: {
            user: true,
            userAddress: true,
          },
        },
        payment: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }
    const shipmentDetail = shipment.shipmentDetails;

    if (!shipmentDetail) {
      throw new NotFoundException(
        `Shipment details for shipment ID ${shipmentId} not found`,
      );
    }

    const pdfData: ShipmentPdfData = {
      trackingNumber: shipment.trackingNumber || '',
      shipmentId: shipment.id,
      createdAt: shipment.createdAt,
      deliveryType: shipmentDetail.deliveryType,
      packageType: shipmentDetail.packageType,
      weight: shipmentDetail.weight || 0,
      price: shipment.price || 0,
      distance: shipment.distance || 0,
      paymentStatus: shipment.paymentStatus || 'N/A',
      deliveryStatus: shipment.deliveryStatus || 'N/A',
      basePrice: shipmentDetail.basePrice || 0,
      weightPrice: shipmentDetail.weightPrice || 0,
      distancePrice: shipmentDetail.distancePrice || 0,
      senderName: shipmentDetail.user.name,
      senderPhone: shipmentDetail.user.phoneNumber,
      pickupAddress: shipmentDetail.userAddress.address,
      seederEmail: shipmentDetail.user.email,
      recipientName: shipmentDetail.recipientName,
      recipientPhone: shipmentDetail.recipientPhone,
      destinationAddress: shipmentDetail.destinationAddress,
      qrCodePath:
        shipment.qrCodeImage ||
        (await this.qrCodeService.generateQrCode(
          shipment.trackingNumber || '',
        )),
    };

    return this.pdfService.generateShipmentPdf(pdfData);
  }

  async findShipmentByTrackingNumber(
    trackingNumber: string,
  ): Promise<Shipment> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        shipmentDetails: {
          include: {
            user: true,
            userAddress: true,
          },
        },
        payment: true,
        shipmentHistories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment with tracking number ${trackingNumber} not found`,
      );
    }

    return shipment;
  }

  private normalizeInvoice(invoice: XenditInvoice): NormalizedInvoice {
    const expiryDate =
      invoice.expiryDate instanceof Date
        ? invoice.expiryDate
        : new Date(invoice.expiryDate);

    const externalId = invoice.externalId ?? invoice.external_id;
    const invoiceUrl = invoice.invoiceUrl ?? invoice.invoice_url;

    if (Number.isNaN(expiryDate.getTime())) {
      throw new Error('Invalid invoice expiry date from Xendit');
    }

    if (!externalId) {
      throw new Error('Missing externalId from Xendit invoice response');
    }

    if (!invoiceUrl) {
      throw new Error('Missing invoiceUrl from Xendit invoice response');
    }

    return {
      id: invoice.id ?? null,
      externalId,
      status: invoice.status,
      invoiceUrl,
      expiryDate,
    };
  }
}
