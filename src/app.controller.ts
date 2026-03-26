import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/legged-in.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';
import { RequireAnyPermissions } from './modules/auth/decorators/permissions.decorator';
import { EmailService } from './common/email/email.service';
import { QueueService } from './common/queue/queue.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('protected')
  @RequireAnyPermissions('shipments.create')
  getProtectedResource() {
    return 'This is a protected resource';
  }

  @Get('send-email-test')
  async sendEmailTest(): Promise<string> {
    await this.queueService.addEmailJob(
      {
        to: 'testing@mail.com',
        type: 'testing',
      },
      { attempts: 1 },
    );
    return 'Test email sent successfully';
  }
}
