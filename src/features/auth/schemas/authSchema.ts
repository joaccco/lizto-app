import { z } from 'zod';
import { instantSchema } from '@/core/domain/time';

export const loginSchema = z.object({
  email: z.string().trim().email('validation.email'),
  password: z.string().min(1, 'validation.passwordLogin'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'validation.name')
    .refine(value => [...value].length <= 255, 'validation.nameMax'),
  email: z.string().trim().email('validation.email'),
  password: z.string().min(8, 'validation.passwordRegister')
    .regex(/[A-Z]/, 'validation.passwordUppercase')
    .regex(/[0-9]/, 'validation.passwordNumber'),
  password_confirmation: z.string().min(8, 'validation.passwordConfirmation'),
  phone: z.string().refine(value => [...value].length <= 50, 'validation.phoneMax').nullable().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'validation.passwordMismatch',
  path: ['password_confirmation'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.string(),
  roles: z.array(z.string()),
  has_provider_profile: z.boolean(),
  linked_oauth_providers: z.array(z.enum(['google', 'facebook'])).optional(),
  created_at: instantSchema.nullable().optional(),
});

export type User = z.infer<typeof userSchema>;

export const loginResponseSchema = z.object({
  data: z.object({
    user: userSchema,
    token: z.string(),
  }),
  message: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const registerResponseSchema = z.object({
  data: z.object({
    user: userSchema,
    token: z.string(),
  }),
  message: z.string(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const meResponseSchema = z.object({
  data: userSchema,
});
