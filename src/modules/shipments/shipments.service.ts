import { XenditService } from './../../common/xendit/xendit.service';
import { QueueService } from './../../common/queue/queue.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { Shipment } from '@prisma/client';
import { getDistance } from 'geolib';
import { PaymentStatus } from 'src/common/enum/payment-status.enum';
import { XenditInvoice } from 'src/common/xendit/xendit.service';

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

    await this.prisma.$transaction(async (prisma) => {
      await prisma.payment.create({
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

    return shipment;
  }

  findAll() {
    return `This action returns all shipments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shipment`;
  }

  update(id: number, _updateShipmentDto: UpdateShipmentDto) {
    void _updateShipmentDto;
    return `This action updates a #${id} shipment`;
  }

  remove(id: number) {
    return `This action removes a #${id} shipment`;
  }

  private normalizeDeliveryType(deliveryType: string): DeliveryType {
    if (deliveryType === 'same_day' || deliveryType === 'next_day') {
      return deliveryType;
    }

    return 'regular';
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
