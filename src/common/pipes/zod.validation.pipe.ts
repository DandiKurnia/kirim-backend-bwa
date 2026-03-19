import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodType, ZodError, ZodIssue } from 'zod';

interface ZodSchemaClass {
  schema: ZodType;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (this.isZodSchema(metadata.metatype)) {
      const schema: ZodType = metadata.metatype.schema;
      const result = schema.safeParse(value);

      if (!result.success) {
        const error: ZodError = result.error;
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.issues.map((issue: ZodIssue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      return result.data;
    }

    return value;
  }

  private isZodSchema(metatype?: unknown): metatype is ZodSchemaClass {
    if (typeof metatype !== 'function') return false;

    const candidate = metatype as unknown as Record<string, unknown>;
    const schema = candidate['schema'];

    return (
      schema !== undefined &&
      typeof (schema as Record<string, unknown>)['safeParse'] === 'function'
    );
  }
}
