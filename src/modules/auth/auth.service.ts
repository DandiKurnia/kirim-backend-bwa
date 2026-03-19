import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  AuthLoginResponse,
  UserResponse,
} from './response/auth-login.response';
import { plainToInstance } from 'class-transformer';
import { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(request: AuthLoginDto): Promise<AuthLoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: request.email,
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
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY ?? 'secretKey',
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue,
    });
    // eslint-disable-next-line
    const { password: _, ...userWithoutPassword } = user;

    const transformedUser = {
      ...userWithoutPassword,

      role: {
        ...user.role,
        permissions: user.role.rolePermissions.map((rolePermission) => ({
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          key: rolePermission.permission.key,
          resource: rolePermission.permission.resource,
        })),
      },
    };

    const userResponse = plainToInstance(UserResponse, transformedUser, {
      excludeExtraneousValues: true,
    });

    return plainToInstance(
      AuthLoginResponse,
      {
        accessToken,
        user: userResponse,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
