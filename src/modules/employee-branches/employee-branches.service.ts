import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeBranchDto } from './dto/create-employee-branch.dto';
import { UpdateEmployeeBranchDto } from './dto/update-employee-branch.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmployeeBranch } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeBranchesService {
  constructor(private prisma: PrismaService) {}

  private async validateUniqueEmail(
    email: string,
    excludeUserId?: number,
  ): Promise<void> {
    const exitingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (exitingUser && exitingUser.id !== excludeUserId) {
      throw new BadRequestException('Email already exists');
    }
  }

  private async validateBranchExists(branchId: number): Promise<void> {
    const existingBranch = await this.prisma.branch.findUnique({
      where: {
        id: branchId,
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }
  }

  private async validateRoleExists(roleId: number): Promise<void> {
    const existingRole = await this.prisma.role.findUnique({
      where: {
        id: roleId,
      },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
  }

  async create(
    createEmployeeBranchDto: CreateEmployeeBranchDto,
  ): Promise<EmployeeBranch> {
    await Promise.all([
      this.validateUniqueEmail(createEmployeeBranchDto.email),
      this.validateBranchExists(createEmployeeBranchDto.branch_id),
      this.validateRoleExists(createEmployeeBranchDto.role_id),
    ]);

    return this.prisma.$transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(
        createEmployeeBranchDto.password,
        10,
      );
      const user = await tx.user.create({
        data: {
          name: createEmployeeBranchDto.name,
          email: createEmployeeBranchDto.email,
          password: hashedPassword,
          avatar: createEmployeeBranchDto.avatar,
          phoneNumber: createEmployeeBranchDto.phone_number,
          roleId: createEmployeeBranchDto.role_id,
        },
      });

      const employeeBranch = await tx.employeeBranch.create({
        data: {
          branchId: createEmployeeBranchDto.branch_id,
          userId: user.id,
          type: createEmployeeBranchDto.type,
        },
      });

      return employeeBranch;
    });
  }

  async findAll(): Promise<EmployeeBranch[]> {
    return this.prisma.employeeBranch.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const employeeBranch = await this.prisma.employeeBranch.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
    if (!employeeBranch) {
      throw new NotFoundException(`Employee branch with ID ${id} not found`);
    }
    return employeeBranch;
  }

  async update(
    id: number,
    updateEmployeeBranchDto: UpdateEmployeeBranchDto,
  ): Promise<EmployeeBranch> {
    const existingEmployeeBranch = await this.findOne(id);
    const validationPromises: Promise<void>[] = [];

    if (updateEmployeeBranchDto.email) {
      validationPromises.push(
        this.validateUniqueEmail(
          updateEmployeeBranchDto.email,
          existingEmployeeBranch.userId,
        ),
      );
    }

    if (updateEmployeeBranchDto.branch_id) {
      validationPromises.push(
        this.validateBranchExists(updateEmployeeBranchDto.branch_id),
      );
    }

    if (updateEmployeeBranchDto.role_id) {
      validationPromises.push(
        this.validateRoleExists(updateEmployeeBranchDto.role_id),
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await Promise.all(validationPromises);
      await tx.user.update({
        where: {
          id: existingEmployeeBranch.userId,
        },
        data: {
          name: updateEmployeeBranchDto.name,
          email: updateEmployeeBranchDto.email,
          avatar: updateEmployeeBranchDto.avatar,
          phoneNumber: updateEmployeeBranchDto.phone_number,
          roleId: updateEmployeeBranchDto.role_id,
          ...(updateEmployeeBranchDto.password && {
            password: await bcrypt.hash(updateEmployeeBranchDto.password, 10),
          }),
        },
      });

      const employeeBranch = await tx.employeeBranch.update({
        where: {
          id,
        },
        data: {
          branchId: updateEmployeeBranchDto.branch_id,
          type: updateEmployeeBranchDto.type,
        },
      });

      return {
        ...employeeBranch,
      };
    });
  }

  async remove(id: number): Promise<void> {
    const employeeBranch = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.employeeBranch.delete({
        where: {
          id,
        },
      });
      await tx.user.delete({
        where: {
          id: employeeBranch.userId,
        },
      });
    });
  }
}
