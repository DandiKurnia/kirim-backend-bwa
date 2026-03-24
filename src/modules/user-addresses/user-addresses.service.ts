import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { OpenCageService } from 'src/common/opencage/opencage.service';
import { UserAddress } from '@prisma/client';

@Injectable()
export class UserAddressesService {
  constructor(
    private prisma: PrismaService,
    private opencage: OpenCageService,
  ) {}

  private readonly UPLOADS_PATH = '/uploads/photos/';

  private generatePhotoPath(filename?: string): string | null {
    return filename ? `${this.UPLOADS_PATH}${filename}` : null;
  }

  private async getCoordinates(
    address: string,
  ): Promise<{ lat: number; lng: number }> {
    return await this.opencage.geocode(address);
  }

  async create(
    createUserAddressDto: CreateUserAddressDto,
    userId: number,
    photoFileName?: string | null,
  ): Promise<UserAddress> {
    const { lat, lng } = await this.getCoordinates(
      createUserAddressDto.address,
    );

    if (photoFileName) {
      createUserAddressDto.photo = this.generatePhotoPath(photoFileName);
    }

    return this.prisma.userAddress.create({
      data: {
        userId,
        address: createUserAddressDto.address,
        tag: createUserAddressDto.tag,
        label: createUserAddressDto.label,
        photo: createUserAddressDto.photo,
        latitude: lat,
        longitude: lng,
      },
    });
  }

  async findAll(userId: number): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: {
        userId,
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
      },
    });
  }

  async findOne(id: number): Promise<UserAddress> {
    const userAddress = await this.prisma.userAddress.findUnique({
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
      },
    });

    if (!userAddress) {
      throw new NotFoundException(`User address with id ${id} not found`);
    }
    return userAddress;
  }

  async update(
    id: number,
    updateUserAddressDto: UpdateUserAddressDto,
    photoFileName?: string | null,
  ): Promise<UserAddress> {
    const userAddress = await this.findOne(id);

    let newLatitude: number = userAddress.latitude!;
    let newLongitude: number = userAddress.longitude!;

    if (
      updateUserAddressDto.address &&
      updateUserAddressDto.address !== userAddress.address
    ) {
      const coordinates = await this.getCoordinates(
        updateUserAddressDto.address,
      );
      newLatitude = coordinates.lat;
      newLongitude = coordinates.lng;
    }

    if (photoFileName) {
      updateUserAddressDto.photo = this.generatePhotoPath(photoFileName);
    }

    return this.prisma.userAddress.update({
      where: {
        id,
      },
      data: {
        address: updateUserAddressDto.address ?? userAddress.address,
        tag: updateUserAddressDto.tag ?? userAddress.tag,
        label: updateUserAddressDto.label ?? userAddress.label,
        photo: updateUserAddressDto.photo ?? userAddress.photo,
        latitude: newLatitude,
        longitude: newLongitude,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.userAddress.delete({
      where: {
        id,
      },
    });
  }
}
