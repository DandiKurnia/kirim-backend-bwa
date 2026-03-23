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

@Module({
  imports: [AuthModule, RolesModule, PermissionsModule, ProfileModule, BranchesModule],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, PrismaService],
})
export class AppModule {}
