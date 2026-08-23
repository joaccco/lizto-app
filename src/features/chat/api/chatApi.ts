import { httpClient } from '@/core/api/httpClient';
import { z } from 'zod';
import {
  conversationDetailSchema,
  messageSchema,
  ConversationDetail,
  ChatMessage,
  SendMessageData,
  sendMessageSchema,
} from '../schemas/chatSchema';

const getMessagesResponseSchema = z.object({
  data: conversationDetailSchema,
});

const sendMessageResponseSchema = z.object({
  data: messageSchema,
  message: z.string(),
});

export const chatApi = {
  /**
   * Obtener historial de mensajes y contexto de conversación
   * GET /v1/conversations/{uuid}/messages
   */
  async getConversation(uuid: string): Promise<ConversationDetail> {
    const response = await httpClient.get(
      `/v1/conversations/${uuid}/messages`,
      getMessagesResponseSchema
    );
    return response.data;
  },

  /**
   * Enviar un nuevo mensaje a la conversación
   * POST /v1/conversations/{uuid}/messages
   */
  async sendMessage(uuid: string, data: SendMessageData): Promise<{ data: ChatMessage; message: string }> {
    const validatedData = sendMessageSchema.parse(data);
    return httpClient.post(
      `/v1/conversations/${uuid}/messages`,
      sendMessageResponseSchema,
      validatedData
    );
  },
};
