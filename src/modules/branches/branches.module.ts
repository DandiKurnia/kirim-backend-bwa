import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, PrismaService, PermissionsService],
})
export class BranchesModule {}
