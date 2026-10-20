import { httpClient } from '@/core/api/httpClient';
import { z } from 'zod';
import {
  conversationDetailSchema,
  sentMessageSchema,
  ConversationDetail,
  SendMessageData,
  sendMessageSchema,
} from '../schemas/chatSchema';

const getMessagesResponseSchema = z.object({
  data: conversationDetailSchema,
});

const sendMessageResponseSchema = z.object({
  data: sentMessageSchema,
  message: z.string(),
});

export const chatApi = {
  /**
   * Obtener historial de mensajes y contexto de conversación
   * GET /v1/conversations/{uuid}/messages
   */
  async getConversation(uuid: string, signal?: AbortSignal): Promise<ConversationDetail> {
    z.string().uuid().parse(uuid);
    const response = await httpClient.get(
      `/conversations/${uuid}/messages`,
      getMessagesResponseSchema,
      { signal }
    );
    return response.data;
  },

  /**
   * Enviar un nuevo mensaje a la conversación
   * POST /v1/conversations/{uuid}/messages
   */
  async sendMessage(uuid: string, data: SendMessageData) {
    z.string().uuid().parse(uuid);
    const validatedData = sendMessageSchema.parse(data);
    return httpClient.post(
      `/conversations/${uuid}/messages`,
      sendMessageResponseSchema,
      validatedData
    );
  },
};
