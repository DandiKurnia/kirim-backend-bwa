import { PermissionsService } from './../../permissions/permissions.service';
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
type PermissionMetadata =
  | string[]
  | {
      type: 'any' | 'all';
      permissions: string[];
    };

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: number } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not Authenticated');
    }

    let hasPermission = false;

    if (
      typeof requiredPermissions === 'object' &&
      !Array.isArray(requiredPermissions) &&
      'type' in requiredPermissions
    ) {
      const { type, permissions } = requiredPermissions;

      if (type === 'any') {
        hasPermission = await this.permissionsService.userHasAnyPermission(
          user.id,
          permissions,
        );
      } else {
        hasPermission = await this.permissionsService.userHasAllPermissions(
          user.id,
          permissions,
        );
      }

      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied. Required permissions: ${permissions.join(', ')}`,
        );
      }
    } else {
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];
      const hasPermission = await this.permissionsService.userHasAllPermissions(
        user.id,
        permissions,
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied. Required permissions: ${permissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
