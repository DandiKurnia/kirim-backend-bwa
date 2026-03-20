import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';
import { RoleResponse } from '../auth/response/auth-login.response';
import { BaseResponse } from 'src/common/interface/base-response.interface';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<BaseResponse<RoleResponse[]>> {
    const roles = await this.rolesService.findAll();
    return {
      message: 'Roles fetched successfully',
      data: roles,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BaseResponse<RoleResponse>> {
    const role = await this.rolesService.findOne(+id);
    return {
      message: `Role fetched by id ${id} successfully`,
      data: role,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<BaseResponse<RoleResponse>> {
    const role = await this.rolesService.update(+id, updateRoleDto);
    return {
      message: `Role updated by id ${id} successfully`,
      data: role,
    };
  }
}
