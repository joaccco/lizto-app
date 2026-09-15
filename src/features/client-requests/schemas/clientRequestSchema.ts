import { z } from 'zod';
export const clientRequestSchema = z.object({
  uuid: z.string().uuid(), raw_prompt: z.string(), full_prompt: z.string(),
  status: z.enum(['pending_survey', 'pending_matching', 'matching_active', 'provider_selected', 'pending_provider', 'pending_confirmation', 'confirmed', 'pending_diagnosis_quote', 'in_progress', 'pending_completion', 'active', 'completed', 'cancelled', 'expired', 'disputed', 'no_show']),
  category: z.object({ name: z.string(), slug: z.string() }).nullable(),
  conversation_id: z.string().uuid().nullable(),
  created_at: z.string().datetime({ offset: true }).nullable(),
});
export const clientRequestsResponseSchema = z.object({ data: z.array(clientRequestSchema), meta: z.object({ current_page: z.number().int().positive(), last_page: z.number().int().positive(), total: z.number().int().nonnegative() }) });
export type ClientRequest = z.infer<typeof clientRequestSchema>;
