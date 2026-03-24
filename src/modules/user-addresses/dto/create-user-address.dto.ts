import z from 'zod';

const createUserAddressSchema = z.object({
  address: z
    .string({
      error: 'Address must be a string',
    })
    .min(1, 'Address is required'),
  tag: z
    .string({
      error: 'Tag must be a string',
    })
    .min(1, 'Tag is required'),
  label: z
    .string({
      error: 'Label must be a string',
    })
    .min(1, 'Label is required'),
  photo: z.string().optional().nullable(),
});

export class CreateUserAddressDto {
  static schema: z.ZodType<any> = createUserAddressSchema;
  constructor(
    public address: string,
    public tag: string,
    public label: string,
    public photo: string | null,
  ) {}
}
