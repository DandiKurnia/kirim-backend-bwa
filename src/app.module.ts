import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { PrismaService } from './common/prisma/prisma.service';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProfileModule } from './modules/profile/profile.module';
import { BranchesModule } from './modules/branches/branches.module';
import { EmployeeBranchesModule } from './modules/employee-branches/employee-branches.module';
import { UserAddressesModule } from './modules/user-addresses/user-addresses.module';
import { EmailService } from './common/email/email.service';
import { QueueModule } from './common/queue/queue.module';

@Module({
  imports: [
    AuthModule,
    RolesModule,
    PermissionsModule,
    ProfileModule,
    BranchesModule,
    EmployeeBranchesModule,
    UserAddressesModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, PrismaService, EmailService],
})
export class AppModule {}
