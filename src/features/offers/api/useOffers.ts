import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from './offersApi';
import { WORK_REQUESTS_QUERY_KEY } from '@/features/work-requests/api/useWorkRequests';
import { workRequestDetailKey } from '@/features/work-requests/api/useWorkRequestDetail';
import { CreateOfferFormData, AskQuestionFormData } from '../schemas/offerSchema';

export function useCreateOffer(serviceRequestId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOfferFormData) => offersApi.store(serviceRequestId, data),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: workRequestDetailKey(serviceRequestId) }),
        client.invalidateQueries({ queryKey: WORK_REQUESTS_QUERY_KEY }),
      ]);
    },
  });
}

export function useAskQuestion(offerId: string | null, serviceRequestId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: AskQuestionFormData) => {
      if (!offerId) throw new Error('OFFER_REQUIRED');
      return offersApi.askQuestion(offerId, data);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: workRequestDetailKey(serviceRequestId) }),
  });
}

export function useDeclineWorkRequest(serviceRequestId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => offersApi.declineRequest(serviceRequestId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: WORK_REQUESTS_QUERY_KEY }),
        client.invalidateQueries({ queryKey: workRequestDetailKey(serviceRequestId) }),
      ]);
    },
  });
}
