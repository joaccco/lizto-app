import { useQuery } from '@tanstack/react-query';
import { authApi } from './authApi';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../schemas/authSchema';

export const ME_QUERY_KEY = ['auth', 'me'];

export function useMe() {
  const token = useAuthStore((state) => state.token);

  return useQuery<User, Error>({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.getMe,
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}
