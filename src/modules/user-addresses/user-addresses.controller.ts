import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { JwtAuthGuard } from '../auth/guards/legged-in.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BaseResponse } from 'src/common/interface/base-response.interface';
import { UserAddress } from '@prisma/client';

type RequestWithUser = {
  id: number;
};

@Controller('user-addresses')
@UseGuards(JwtAuthGuard)
export class UserAddressesController {
  constructor(private readonly userAddressesService: UserAddressesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './public/uploads/photos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createUserAddressDto: CreateUserAddressDto,
    @Req() req: Request & { user?: RequestWithUser },
    @UploadedFile() photo: Express.Multer.File | undefined,
  ): Promise<BaseResponse<UserAddress>> {
    return {
      data: await this.userAddressesService.create(
        createUserAddressDto,
        req.user!.id,
        photo ? photo?.filename : null,
      ),
      message: 'User address created successfully',
    };
  }

  @Get()
  async findAll(
    @Req() req: Request & { user?: RequestWithUser },
  ): Promise<BaseResponse<UserAddress[]>> {
    return {
      data: await this.userAddressesService.findAll(req.user!.id),
      message: 'User addresses retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BaseResponse<UserAddress>> {
    return {
      data: await this.userAddressesService.findOne(+id),
      message: 'User address retrieved successfully',
    };
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './public/uploads/photos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
          return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
  ): Promise<BaseResponse<UserAddress>> {
    return {
      data: await this.userAddressesService.update(
        +id,
        updateUserAddressDto,
        photo ? photo.filename : null,
      ),
      message: 'User address updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<BaseResponse<void>> {
    await this.userAddressesService.remove(+id);
    return {
      data: null,
      message: 'User address deleted successfully',
    };
  }
}
