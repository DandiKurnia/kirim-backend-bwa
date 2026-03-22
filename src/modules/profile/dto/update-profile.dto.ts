import z, { ZodObject } from 'zod';

const UpdateProfileSchema = z.object({
  name: z
    .string({
      error: 'Name must be a string and required',
    })
    .optional(),
  email: z
    .string({
      error: 'Email must be a string and required',
    })
    .email('Invalid email address')
    .optional(),
  phone_number: z
    .string({
      error: 'Phone must be a string and required',
    })
    .min(10, 'Phone must be at least 10 characters long')
    .optional(),
  password: z
    .string({
      error: 'Password must be a string and required',
    })
    .min(8, 'Password must be at least 8  characters long')
    .optional(),
  avatar: z
    .string({
      error: 'Avatar must be a string',
    })
    .nullable()
    .optional(),
});

export class UpdateProfileDto {
  static schema: ZodObject<any> = UpdateProfileSchema;

  constructor(
    public name: string,
    public email: string,
    public phone_number: string,
    public password: string,
    public avatar: string | null,
  ) {}
}
