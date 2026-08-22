import { httpClient } from '@/core/api/httpClient';
import { loginResponseSchema, meResponseSchema, LoginFormData, LoginResponse, User } from '../schemas/authSchema';
import { z } from 'zod';

export const authApi = {
  login: async (data: LoginFormData): Promise<LoginResponse> => {
    return httpClient<LoginResponse>('/auth/login', loginResponseSchema, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false,
    });
  },

  getMe: async (): Promise<User> => {
    const res = await httpClient<{ data: User }>('/auth/me', meResponseSchema, {
      method: 'GET',
      requiresAuth: true,
    });
    return res.data;
  },

  logout: async (): Promise<void> => {
    await httpClient<{ message: string }>('/auth/logout', z.object({ message: z.string() }), {
      method: 'POST',
      requiresAuth: true,
    }).catch(() => {
      // Si la API falla o 401, el token ya fue borrado localmente
    });
  },
};
