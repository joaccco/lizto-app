import { z } from 'zod';
import { ensureExplicitTimezoneISO } from '@/core/domain/time';

export const workRequestItemSchema = z.object({
  id: z.string(),
  work_id: z.string().nullable().optional(),
  conversation_id: z.string().nullable().optional(),
  category: z.string(),
  category_slug: z.string(),
  raw_prompt: z.string(),
  client_name: z.string(),
  urgency: z.string(),
  location: z.string(),
  location_lat: z.number(),
  location_lng: z.number(),
  location_address: z.string(),
  status: z.string(),
  estimated_duration_min: z.number().default(60),
  created_at: z.string().transform((val) => {
    return ensureExplicitTimezoneISO(val);
  }),
});

export type WorkRequestItem = z.infer<typeof workRequestItemSchema>;

export const workRequestsResponseSchema = z.object({
  data: z.array(workRequestItemSchema),
});

export type WorkRequestsResponse = z.infer<typeof workRequestsResponseSchema>;
