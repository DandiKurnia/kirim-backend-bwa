import { z, ZodObject } from 'zod';

const updateRoleSchema = z.object({
  permission_ids: z
    .array(
      z.number({
        error: 'Permission ID must be a number',
      }),
    )
    .nonempty('At least one permission is required'),
});

export class UpdateRoleDto {
  static schema: ZodObject<any> = updateRoleSchema;

  constructor(public permission_ids: number[]) {}
}
