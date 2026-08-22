import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/core/api/httpClient';
import { workRequestsResponseSchema, WorkRequestItem } from '../schemas/workRequestSchema';

export const WORK_REQUESTS_QUERY_KEY = ['provider', 'work-requests'];

export function useWorkRequests() {
  return useQuery<WorkRequestItem[], Error>({
    queryKey: WORK_REQUESTS_QUERY_KEY,
    queryFn: async () => {
      const response = await httpClient('/provider/work-requests', workRequestsResponseSchema, {
        method: 'GET',
        requiresAuth: true,
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 segundos
    refetchOnWindowFocus: true,
  });
}
