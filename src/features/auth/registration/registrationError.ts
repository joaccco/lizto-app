import { z } from 'zod';
import { HttpError } from '@/core/api/httpClient';

const fieldSchema = z.enum(['name', 'email', 'password', 'password_confirmation']);
export type RegistrationField = z.infer<typeof fieldSchema>;
const validationSchema = z.object({ errors: z.record(z.array(z.string())) });
export function registrationError(error: unknown): { message: string; fields: RegistrationField[] } {
  if (error instanceof HttpError) {
    if (error.status === 429) return { message: 'auth.rateLimited', fields: [] };
    if (error.status === 422) {
      const parsed = validationSchema.safeParse(error.body);
      const fields = parsed.success ? Object.keys(parsed.data.errors).flatMap(key => {
        const field = fieldSchema.safeParse(key);
        return field.success ? [field.data] : [];
      }) : [];
      return { message: fields.includes('email') ? 'registration.emailUnavailable' : 'registration.validationFailed', fields };
    }
  }
  return { message: 'registration.failed', fields: [] };
}
