import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | Date
  | JsonValue[]
  | { [key: string]: JsonValue };

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<JsonValue>,
  ): Observable<JsonValue> | Promise<Observable<JsonValue>> {
    return next
      .handle()
      .pipe(map((data) => this.transformKeysToSnakeCase(data)));
  }

  private toSnakeCase(key: string): string {
    return key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  private transformKeysToSnakeCase(data: JsonValue): JsonValue {
    if (Array.isArray(data)) {
      return data.map((item) => this.transformKeysToSnakeCase(item));
    } else if (data instanceof Date) {
      return data;
    } else if (data !== null && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          this.toSnakeCase(key),
          this.transformKeysToSnakeCase(value),
        ]),
      ) as Record<string, JsonValue>;
    }
    return data;
  }
}
