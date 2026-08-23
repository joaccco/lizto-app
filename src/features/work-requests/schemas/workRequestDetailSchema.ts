import { z } from 'zod';

export const workRequestDetailSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  raw_prompt: z.string(),
  status: z.string(),
  urgency: z.string(),
  formatted_schedule: z.string().nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  window_start: z.string().nullable().optional(),
  window_end: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  location_address: z.string().nullable().optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  is_approximate: z.boolean().optional(),
  location_radius_meters: z.number().nullable().optional(),
  created_at: z.string(),
  conversation_id: z.string().nullable().optional(),
  category: z
    .object({
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
  accepted_provider: z
    .object({
      id: z.string(),
      name: z.string(),
      avatar_url: z.string().nullable().optional(),
      avg_rating: z.number().optional(),
    })
    .nullable()
    .optional(),
  brief: z
    .object({
      summary: z.string().optional(),
      attributes: z.record(z.string(), z.any()).optional(),
    })
    .nullable()
    .optional(),
  questions_and_answers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
});

export type WorkRequestDetail = z.infer<typeof workRequestDetailSchema>;
