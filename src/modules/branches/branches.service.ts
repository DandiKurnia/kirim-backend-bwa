import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Branch } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = await this.prisma.branch.create({
      data: {
        name: createBranchDto.name,
        address: createBranchDto.address,
        phoneNumber: createBranchDto.phone_number,
      },
    });
    return branch;
  }

  async findAll(): Promise<Branch[]> {
    const branches = await this.prisma.branch.findMany();
    return branches;
  }

  async findOne(id: number): Promise<Branch> {
    const branch = await this.prisma.branch.findUnique({
      where: {
        id,
      },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    return branch;
  }

  async update(id: number, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.prisma.branch.update({
      where: {
        id,
      },
      data: {
        name: updateBranchDto.name,
        address: updateBranchDto.address,
        phoneNumber: updateBranchDto.phone_number,
      },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    return branch;
  }

  async remove(id: number): Promise<Branch> {
    await this.findOne(id);
    const branch = await this.prisma.branch.delete({
      where: {
        id,
      },
    });
    return branch;
  }
}
