import { useQuery } from '@tanstack/react-query';
import { authApi } from './authApi';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../schemas/authSchema';

export const ME_QUERY_KEY = ['auth', 'me'];

export function useMe(enabled = true) {
  const token = useAuthStore((state) => state.token);
  const storageError = useAuthStore((state) => state.storageError);

  return useQuery<User, Error>({
    queryKey: ME_QUERY_KEY,
    queryFn: ({ signal }) => authApi.getMe(signal),
    enabled: enabled && Boolean(token) && !storageError,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}
