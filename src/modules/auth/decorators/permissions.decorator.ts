import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

export const RequireAnyPermissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, { type: 'any', permissions });
};

export const RequireAllPermissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, { type: 'all', permissions });
};
