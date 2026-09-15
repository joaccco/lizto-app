import { useInfiniteQuery } from '@tanstack/react-query';
import { httpClient } from '@/core/api/httpClient';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { clientRequestsResponseSchema } from '../schemas/clientRequestSchema';
export function useClientRequests() {
  const token = useAuthStore(state => state.token);
  return useInfiniteQuery({
    queryKey: ['client', 'requests'], enabled: Boolean(token), initialPageParam: 1,
    queryFn: ({ pageParam }) => httpClient(`/requests?page=${pageParam}`, clientRequestsResponseSchema),
    getNextPageParam: ({ meta }) => meta.current_page < meta.last_page ? meta.current_page + 1 : undefined,
  });
}
