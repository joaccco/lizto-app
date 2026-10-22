import { z } from 'zod';
import { httpClient, HttpError } from '@/core/api/httpClient';
import { instantSchema } from '@/core/domain/time';
import { loginResponseSchema, newPasswordSchema } from '../schemas/authSchema';

export const recoveryEmailSchema = z.object({ email: z.string().trim().toLowerCase().email('validation.email') });
export const recoveryVerifySchema = recoveryEmailSchema.extend({
  code: z.string().trim().regex(/^[0-9]{6}$/, 'recovery.invalidCodeFormat'),
});
export const recoveryVerifiedSchema = z.object({ data: z.object({ reset_token: z.string().regex(/^[a-f0-9]{64}$/), expires_at: instantSchema }) });
export type RecoveryVerify = z.infer<typeof recoveryVerifySchema>;
export type RecoveryVerified = z.infer<typeof recoveryVerifiedSchema>;
export const recoveryResetSchema = recoveryEmailSchema.extend({
  reset_token: z.string().regex(/^[a-f0-9]{64}$/),
  password: newPasswordSchema,
  password_confirmation: z.string().min(1, 'validation.passwordConfirmation'),
}).refine(value => value.password === value.password_confirmation, { path: ['password_confirmation'], message: 'validation.passwordMismatch' });
export type RecoveryReset = z.infer<typeof recoveryResetSchema>;
export const recoveryCooldownResponseSchema = z.object({ data: z.object({ retry_at: instantSchema }) });
export type RecoveryCooldown = z.infer<typeof recoveryCooldownResponseSchema>['data'];
const requestResponseSchema = recoveryCooldownResponseSchema.extend({ message: z.string() });
export const passwordRecoveryApi = {
  request: (input: z.infer<typeof recoveryEmailSchema>) => httpClient('/auth/forgot-password', requestResponseSchema, {
    method: 'POST', requiresAuth: false, body: JSON.stringify(recoveryEmailSchema.parse(input)),
  }),
  verify: (input: RecoveryVerify) => httpClient('/auth/verify-password-code', recoveryVerifiedSchema, {
    method: 'POST', requiresAuth: false, body: JSON.stringify(recoveryVerifySchema.parse(input)),
  }),
  reset: (input: RecoveryReset) => httpClient('/auth/reset-password', loginResponseSchema, {
    method: 'POST', requiresAuth: false, body: JSON.stringify(recoveryResetSchema.parse(input)),
  }),
};
export function recoveryErrorKey(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 429) return 'auth.rateLimited';
    if (error.status === 422) return 'recovery.invalidCode';
  }
  return 'recovery.unavailable';
}
