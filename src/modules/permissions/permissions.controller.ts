import { Controller, Get } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Permission } from 'src/generated/prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(): Promise<BaseResponse<Permission[]>> {
    const result = await this.permissionsService.findAll();
    return {
      message: 'Permission fetched successfully',
      data: result,
    };
  }
}
