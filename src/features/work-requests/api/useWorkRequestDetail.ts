import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpClient } from '@/core/api/httpClient';
import { workRequestDetailSchema, WorkRequestDetail } from '../schemas/workRequestDetailSchema';

const getWorkRequestDetailResponseSchema = z.object({
  data: workRequestDetailSchema,
});

export const workRequestDetailKey = (uuid: string) => ['work-requests', uuid] as const;

export function useWorkRequestDetail(uuid: string) {
  return useQuery<WorkRequestDetail>({
    queryKey: workRequestDetailKey(uuid),
    queryFn: async ({ signal }) => {
      z.string().uuid().parse(uuid);
      const response = await httpClient.get(
        `/requests/${uuid}`,
        getWorkRequestDetailResponseSchema,
        { signal }
      );
      return response.data;
    },
    enabled: Boolean(uuid),
  });
}
