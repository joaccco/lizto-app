import { z } from 'zod';
import { HttpError } from '@/core/api/httpClient';

const validationErrorSchema = z.object({ errors: z.record(z.array(z.string())).optional() });

export function loginError(error: unknown): {
  message: string;
  fields: Array<'email' | 'password'>;
} {
  if (!(error instanceof HttpError)) return { message: 'auth.connectionError', fields: [] };
  if (error.status === 422) {
    const parsed = validationErrorSchema.safeParse(error.body);
    const fields: Array<'email' | 'password'> = [];
    if (parsed.success) {
      for (const field of ['email', 'password'] as const) {
        if (parsed.data.errors?.[field]?.length) fields.push(field);
      }
    }
    return { message: 'auth.invalidCredentials', fields };
  }
  const message = error.status === 401 ? 'auth.invalidCredentials'
    : error.status === 403 ? 'auth.accountRestricted'
    : error.status === 429 ? 'auth.rateLimited'
    : error.status >= 500 ? 'auth.serviceUnavailable' : 'auth.connectionError';
  return { message, fields: [] };
}
