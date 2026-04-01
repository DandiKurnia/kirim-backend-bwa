import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { Branch } from 'src/generated/prisma/client';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @RequirePermissions('branches.create')
  async create(
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<BaseResponse<Branch>> {
    return {
      message: 'Branch created successfully',
      data: await this.branchesService.create(createBranchDto),
    };
  }

  @Get()
  @RequirePermissions('branches.read')
  async findAll(): Promise<BaseResponse<Branch[]>> {
    return {
      message: 'Branches fetched successfully',
      data: await this.branchesService.findAll(),
    };
  }

  @Get(':id')
  @RequirePermissions('branches.read')
  async findOne(@Param('id') id: string): Promise<BaseResponse<Branch>> {
    return {
      message: `Branch with ID ${id} fetched successfully`,
      data: await this.branchesService.findOne(+id),
    };
  }

  @Patch(':id')
  @RequirePermissions('branches.update')
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<BaseResponse<Branch>> {
    return {
      message: `Branch with ID ${id} updated successfully`,
      data: await this.branchesService.update(+id, updateBranchDto),
    };
  }

  @Delete(':id')
  @RequirePermissions('branches.delete')
  async remove(@Param('id') id: string): Promise<BaseResponse<Branch>> {
    await this.branchesService.remove(+id);
    return {
      message: `Branch with ID ${id} deleted successfully`,
      data: null,
    };
  }
}
