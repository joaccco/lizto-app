import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './chatApi';
import { ConversationDetail, SendMessageData } from '../schemas/chatSchema';

/**
 * Hook para obtener los mensajes y contexto de conversación.
 * Aplica HTTP Short Polling cada 3000ms según ADR-009.
 */
export function useConversation(uuid: string) {
  return useQuery<ConversationDetail>({
    queryKey: ['chat', uuid],
    queryFn: ({ signal }) => chatApi.getConversation(uuid, signal),
    enabled: Boolean(uuid),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    staleTime: 1000,
  });
}

/**
 * Hook para enviar mensajes. Invalidar la query reactivamente al completar.
 */
export function useSendMessage(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => chatApi.sendMessage(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', uuid] });
    },
  });
}
