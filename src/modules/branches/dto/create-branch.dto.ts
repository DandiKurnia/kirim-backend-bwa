import z, { ZodObject } from 'zod';

const branchSchema = z.object({
  name: z
    .string({
      error: 'Name is required and must be a string',
    })
    .min(1, {
      error: 'Branch name must be at least 1 character long',
    }),
  address: z
    .string({
      error: 'Address is required and must be a string',
    })
    .min(1, {
      error: 'Address must be at least 1 character long',
    }),
  phone_number: z
    .string({
      error: 'Phone number is required and must be a string',
    })
    .min(1, {
      error: 'Phone number must be at least 1 character long',
    }),
});

export class CreateBranchDto {
  static schema: ZodObject<any> = branchSchema;

  constructor(
    public readonly name: string,
    public readonly address: string,
    public readonly phone_number: string,
  ) {}
}
