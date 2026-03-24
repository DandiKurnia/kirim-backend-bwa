import z, { ZodObject } from 'zod';

const employeeBrachSchema = z.object({
  name: z
    .string({
      error: 'Name is required and must be a string',
    })
    .min(1, 'Name must be at least 1 character long'),
  email: z
    .string({
      error: 'Email is required and must be a string',
    })
    .email('Email is invalid'),
  phone_number: z
    .string({
      error: 'Phone number is required and must be a string',
    })
    .min(10, 'Phone number must be at least 10 character long'),
  branch_id: z
    .number({
      error: 'Branch ID is required and must be a number',
    })
    .int('Branch ID must be an integer'),
  type: z
    .string({
      error: 'Type is required and must be a string',
    })
    .min(1, 'Type must be at least 1 character long'),
  role_id: z
    .number({
      error: 'Role ID is required and must be a number',
    })
    .int('Role ID must be an integer'),
  password: z
    .string({
      error: 'Password is required and must be a string',
    })
    .min(8, 'Password must be at least 8 character long'),
  avatar: z.string().optional().nullable(),
});

export class CreateEmployeeBranchDto {
  static schema: ZodObject<any> = employeeBrachSchema;

  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone_number: string,
    public readonly branch_id: number,
    public readonly type: string,
    public readonly role_id: number,
    public readonly password: string,
    public readonly avatar?: string | null,
  ) {}
}
