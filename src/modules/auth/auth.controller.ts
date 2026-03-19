import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponse } from './response/auth-login.response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() request: AuthLoginDto): Promise<AuthLoginResponse> {
    return await this.authService.login(request);
  }
}
