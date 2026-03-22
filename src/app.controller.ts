import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/legged-in.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';
import { RequireAnyPermissions } from './modules/auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('protected')
  @RequireAnyPermissions('shipments.create')
  getProtectedResource() {
    return 'This is a protected resource';
  }
}
