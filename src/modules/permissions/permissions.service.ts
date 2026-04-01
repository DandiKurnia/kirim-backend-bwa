import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from 'src/generated/prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return await this.prisma.permission.findMany();
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return (
      user.role?.rolePermissions.map(
        (rolePermission) => rolePermission.permission.key,
      ) || []
    );
  }

  async userHasAnyPermission(
    userId: number,
    permission: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.some((p) => permission.includes(p));
  }

  async userHasAllPermissions(
    userId: number,
    permission: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permission.every((p) => userPermissions.includes(p));
  }
}
