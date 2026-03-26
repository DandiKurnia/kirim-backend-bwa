import z from 'zod';

const createShipmentSchema = z.object({
  pickup_address_id: z
    .number({
      error: 'Pickup address ID must be a number',
    })
    .int('Pickup address ID must be an integer'),
  destination_address: z
    .string('Destination address must be a string')
    .min(1, 'Destination address cannot be empty'),
  recipient_name: z
    .string('Recipient name must be a string')
    .min(1, 'Recipient name cannot be empty'),
  recipient_phone: z
    .string('Recipient phone must be a string')
    .min(10, 'Recipient phone must be at least 10 characters long'),
  weight: z
    .number({
      error: 'Weight must be a number',
    })
    .positive('Weight must be a positive number'),
  package_type: z
    .string('Package type must be a string')
    .min(1, 'Package type cannot be empty'),
  delivery_type: z
    .string('Delivery type must be a string')
    .min(1, 'Delivery type cannot be empty'),
});

export class CreateShipmentDto {
  static schema: z.ZodObject<any> = createShipmentSchema;

  constructor(
    public pickup_address_id: number,
    public destination_address: string,
    public recipient_name: string,
    public recipient_phone: string,
    public weight: number,
    public package_type: string,
    public delivery_type: string,
  ) {}
}
