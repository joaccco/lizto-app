import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.string(),
  roles: z.array(z.string()),
  has_provider_profile: z.boolean(),
  created_at: z.string().nullable().optional(),
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

export const meResponseSchema = z.object({
  data: userSchema,
});
