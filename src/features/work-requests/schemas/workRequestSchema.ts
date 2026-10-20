import { z } from 'zod';
import { instantSchema } from '@/core/domain/time';
import { locationFields, redactUnconfirmedLocation } from './locationSchema';

export const workRequestItemSchema = z.object({
  id: z.string().uuid(),
  work_id: z.string().uuid().nullable().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  category: z.string().nullable(),
  category_slug: z.string().nullable(),
  raw_prompt: z.string(),
  client_name: z.string(),
  urgency: z.string(),
  status: z.string(),
  estimated_duration_min: z.number().int().positive().nullable().optional(),
  created_at: instantSchema,
  ...locationFields,
}).transform(redactUnconfirmedLocation);
export type WorkRequestItem = z.infer<typeof workRequestItemSchema>;
export const workRequestsResponseSchema = z.object({ data: z.array(workRequestItemSchema) });
export type WorkRequestsResponse = z.infer<typeof workRequestsResponseSchema>;
