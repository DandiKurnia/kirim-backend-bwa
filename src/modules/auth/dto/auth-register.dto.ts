import { z, ZodObject } from 'zod';

export const authRegisterSchema = z.object({
  email: z
    .string({ error: 'Email is required and must be a string' })
    .email('Email must be a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string({ error: 'Password is required and must be a string' })
    .min(8, 'Password must be at least 8 characters long'),
  name: z
    .string({ error: 'Name is required and must be a string' })
    .min(1, 'Name is required'),
  phone_number: z
    .string({ error: 'Phone is required and must be a string' })
    .min(10, 'Phone must be at least 10 characters long'),
});

export class AuthRegisterDto {
  static schema: ZodObject<any> = authRegisterSchema;

  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly phone_number: string,
  ) {}
}
