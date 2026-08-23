import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpClient } from '@/core/api/httpClient';
import { workRequestDetailSchema, WorkRequestDetail } from '../schemas/workRequestDetailSchema';

const getWorkRequestDetailResponseSchema = z.object({
  data: workRequestDetailSchema,
});

export function useWorkRequestDetail(uuid: string) {
  return useQuery<WorkRequestDetail>({
    queryKey: ['work-requests', uuid],
    queryFn: async () => {
      const response = await httpClient.get(
        `/v1/requests/${uuid}`,
        getWorkRequestDetailResponseSchema
      );
      return response.data;
    },
    enabled: Boolean(uuid),
  });
}
