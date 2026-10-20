import { z } from 'zod';
import { instantSchema } from '@/core/domain/time';

export const messageSchema = z.object({
  id: z.string().uuid(), sender_name: z.string(), content: z.string(),
  created_at: instantSchema, is_me: z.boolean(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export const conversationDetailSchema = z.object({
  conversation_id: z.string().uuid(), work_id: z.string().uuid().nullable().optional(),
  client_name: z.string(), provider_name: z.string(),
  provider_avatar: z.string().nullable().optional(),
  provider_rating: z.number().nullable().optional(), provider_reviews: z.number().int().nonnegative().optional(),
  category_name: z.string(), raw_prompt: z.string(), work_status: z.string(), is_closed: z.boolean(),
  messages: z.array(messageSchema),
});
export type ConversationDetail = z.infer<typeof conversationDetailSchema>;
// sendMessage no incluye sender_name; el siguiente polling carga el mensaje completo.
export const sentMessageSchema = messageSchema.omit({ sender_name: true });
export const sendMessageSchema = z.object({ content: z.string().trim().min(1) });
export type SendMessageData = z.infer<typeof sendMessageSchema>;
