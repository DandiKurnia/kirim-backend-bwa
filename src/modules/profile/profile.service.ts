import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProfileResponse } from './response/profile.response';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';

type UpdateData = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  avatar?: string | null;
};

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}
  async findOne(id: number): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(ProfileResponse, user, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: number,
    updateProfileDto: UpdateProfileDto,
    avatarFileName?: string | null,
  ): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: UpdateData = {};

    if (updateProfileDto.name) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.email) {
      updateData.email = updateProfileDto.email;
    }

    if (updateProfileDto.phone_number) {
      updateData.phoneNumber = updateProfileDto.phone_number;
    }

    if (updateProfileDto.password) {
      updateData.password = await bcrypt.hash(updateProfileDto.password, 10);
    }

    if (avatarFileName) {
      updateData.avatar = `/uploads/photos/${avatarFileName}`;
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateData,
      },
    });

    return plainToInstance(ProfileResponse, updatedUser, {
      excludeExtraneousValues: true,
    });
  }
}
