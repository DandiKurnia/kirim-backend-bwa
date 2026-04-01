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
import { EmployeeBranchesService } from './employee-branches.service';
import { CreateEmployeeBranchDto } from './dto/create-employee-branch.dto';
import { UpdateEmployeeBranchDto } from './dto/update-employee-branch.dto';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { EmployeeBranch } from 'src/generated/prisma/client';

@Controller('employee-branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EmployeeBranchesController {
  constructor(
    private readonly employeeBranchesService: EmployeeBranchesService,
  ) {}

  @Post()
  @RequirePermissions('employee.create')
  async create(
    @Body() createEmployeeBranchDto: CreateEmployeeBranchDto,
  ): Promise<BaseResponse<EmployeeBranch>> {
    const employeeBranch = await this.employeeBranchesService.create(
      createEmployeeBranchDto,
    );
    return {
      message: 'Employee branch created successfully',
      data: employeeBranch,
    };
  }

  @Get()
  @RequirePermissions('employee.read')
  async findAll(): Promise<BaseResponse<EmployeeBranch[]>> {
    const employeeBranches = await this.employeeBranchesService.findAll();
    return {
      message: 'Employee branches retrieved successfully',
      data: employeeBranches,
    };
  }

  @Get(':id')
  @RequirePermissions('employee.read')
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponse<EmployeeBranch>> {
    const employeeBranch = await this.employeeBranchesService.findOne(+id);
    return {
      message: 'Employee branch retrieved successfully',
      data: employeeBranch,
    };
  }

  @Patch(':id')
  @RequirePermissions('employee.update')
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeBranchDto: UpdateEmployeeBranchDto,
  ): Promise<BaseResponse<EmployeeBranch>> {
    const employeeBranch = await this.employeeBranchesService.update(
      +id,
      updateEmployeeBranchDto,
    );
    return {
      message: 'Employee branch updated successfully',
      data: employeeBranch,
    };
  }

  @Delete(':id')
  @RequirePermissions('employee.delete')
  async remove(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.employeeBranchesService.remove(+id);
    return {
      message: 'Employee branch deleted successfully',
      data: null,
    };
  }
}
