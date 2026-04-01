import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { QueueModule } from 'src/common/queue/queue.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { XenditService } from 'src/common/xendit/xendit.service';
import { QrCodeService } from 'src/qrcode/qrcode.service';
import { ShipmentsWebhookController } from './webhook/shipments-webhook.controller';
import { PdfService } from 'src/common/pdf/pdf.service';

@Module({
  imports: [QueueModule],
  controllers: [ShipmentsController, ShipmentsWebhookController],
  providers: [
    ShipmentsService,
    PrismaService,
    OpenCageService,
    XenditService,
    QrCodeService,
    PdfService,
  ],
})
export class ShipmentsModule {}
