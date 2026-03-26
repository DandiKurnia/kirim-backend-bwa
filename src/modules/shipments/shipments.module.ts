import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { QueueModule } from 'src/common/queue/queue.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { XenditService } from 'src/common/xendit/xendit.service';

@Module({
  imports: [QueueModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, PrismaService, OpenCageService, XenditService],
})
export class ShipmentsModule {}
