import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Shipment } from 'src/generated/prisma/client';
import type { Response } from 'express';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @RequirePermissions('shipments.create')
  async create(
    @Body() createShipmentDto: CreateShipmentDto,
  ): Promise<BaseResponse<Shipment>> {
    return {
      data: await this.shipmentsService.create(createShipmentDto),
      message: 'Shipment created successfully',
    };
  }

  @Get()
  async findAll(
    @Req() req: Request & { user: { id: number } },
  ): Promise<BaseResponse<Shipment[]>> {
    return {
      data: await this.shipmentsService.findAll(req.user.id),
      message: 'Shipments retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BaseResponse<Shipment>> {
    return {
      data: await this.shipmentsService.findOne(+id),
      message: 'Shipment retrieved successfully',
    };
  }

  @Get(':id/pdf')
  async generateShipmentPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.shipmentsService.generateShipmentPdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="shipment-${id}.pdf"`,
    });
    res.send(pdfBuffer);
  }
}
