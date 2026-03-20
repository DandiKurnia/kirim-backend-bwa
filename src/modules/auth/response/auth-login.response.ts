import { Expose, Type } from 'class-transformer';

class PermissionResponse {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  key?: string;

  @Expose()
  resource?: string;
}

export class RoleResponse {
  @Expose()
  id?: number;

  @Expose()
  name?: string;

  @Expose()
  key?: string;

  @Expose()
  @Type(() => PermissionResponse)
  permissions!: PermissionResponse[];
}

export class UserResponse {
  @Expose()
  id?: number;

  @Expose()
  email?: string;

  @Expose()
  name?: string;

  @Expose()
  avatar?: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  @Type(() => RoleResponse)
  role?: RoleResponse;
}

export class AuthLoginResponse {
  @Expose()
  accessToken?: string;

  @Expose()
  @Type(() => UserResponse)
  user?: UserResponse;
}
