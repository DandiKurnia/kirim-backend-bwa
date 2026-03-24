import { Module } from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';

@Module({
  controllers: [UserAddressesController],
  providers: [UserAddressesService, PrismaService, OpenCageService],
})
export class UserAddressesModule {}
