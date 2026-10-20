import { z } from 'zod';
import { instantSchema, localDateSchema, localTimeSchema } from '@/core/domain/time';
import { locationFields, redactUnconfirmedLocation } from './locationSchema';

export const workRequestDetailSchema = z.object({
  id: z.string().uuid(),
  uuid: z.string().uuid(),
  raw_prompt: z.string(),
  status: z.string(),
  urgency: z.string(),
  formatted_schedule: z.string().nullable().optional(),
  scheduled_date: localDateSchema.nullable().optional(),
  window_start: localTimeSchema.nullable().optional(),
  window_end: localTimeSchema.nullable().optional(),
  ...locationFields,
  created_at: instantSchema,
  conversation_id: z.string().uuid().nullable().optional(),
  category: z
    .object({
      name: z.string(),
      slug: z.string(),
    })
    .nullable()
    .optional(),
  accepted_provider: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      avatar_url: z.string().nullable().optional(),
      avg_rating: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  brief: z
    .object({
      summary: z.string().optional(),
      attributes: z.record(z.string(), z.unknown()).optional(),
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
}).transform(redactUnconfirmedLocation);

export type WorkRequestDetail = z.infer<typeof workRequestDetailSchema>;
