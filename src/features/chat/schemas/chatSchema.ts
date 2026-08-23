import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  sender_name: z.string(),
  content: z.string(),
  created_at: z.string(),
  is_me: z.boolean(),
});

export type ChatMessage = z.infer<typeof messageSchema>;

export const conversationDetailSchema = z.object({
  conversation_id: z.string(),
  work_id: z.string().nullable().optional(),
  client_id: z.string(),
  client_name: z.string(),
  provider_id: z.string(),
  provider_name: z.string(),
  provider_avatar: z.string().nullable().optional(),
  provider_rating: z.number().optional(),
  provider_reviews: z.number().optional(),
  category_name: z.string(),
  raw_prompt: z.string(),
  work_status: z.string(),
  is_closed: z.boolean(),
  messages: z.array(messageSchema),
});

export type ConversationDetail = z.infer<typeof conversationDetailSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export type SendMessageData = z.infer<typeof sendMessageSchema>;
