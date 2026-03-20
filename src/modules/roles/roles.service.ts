import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RoleResponse } from '../auth/response/auth-login.response';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return roles.map((role) => {
      return {
        id: role.id,
        name: role.name,
        key: role.key,
        permissions: role.rolePermissions.map((rolePermission) => {
          return {
            id: rolePermission.permission.id,
            name: rolePermission.permission.name,
            key: rolePermission.permission.key,
            resource: rolePermission.permission.resource,
          };
        }),
      };
    });
  }

  async findOne(id: number): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      key: role.key,
      permissions: role.rolePermissions.map((rolePermission) => {
        return {
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          key: rolePermission.permission.key,
          resource: rolePermission.permission.resource,
        };
      }),
    };
  }

  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    await this.findOne(id);

    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    if (updateRoleDto.permission_ids.length > 0) {
      const rolePermissions = updateRoleDto.permission_ids.map(
        (permissionId) => {
          return {
            roleId: id,
            permissionId,
          };
        },
      );

      await this.prisma.rolePermission.createMany({
        data: rolePermissions,
        skipDuplicates: true,
      });
    }

    return await this.findOne(id);
  }
}
