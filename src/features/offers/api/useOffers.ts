import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from './offersApi';
import { CreateOfferFormData, AskQuestionFormData } from '../schemas/offerSchema';

export function useCreateOffer(serviceRequestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferFormData) => offersApi.store(serviceRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-requests', serviceRequestId] });
      queryClient.invalidateQueries({ queryKey: ['work-requests'] });
    },
  });
}

export function useAskQuestion(offerOrRequestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AskQuestionFormData) => offersApi.askQuestion(offerOrRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-requests', offerOrRequestId] });
    },
  });
}

export function useDeclineWorkRequest(serviceRequestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => offersApi.declineRequest(serviceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-requests'] });
    },
  });
}
