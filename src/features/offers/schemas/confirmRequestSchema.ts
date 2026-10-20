import { z } from 'zod';
import { minorAmountSchema } from '@/core/domain/money';
import { instantSchema } from '@/core/domain/time';

export const confirmWorkRequestSchema = z.object({
  proposed_price: minorAmountSchema.positive().optional(),
  scheduled_at: instantSchema.optional(),
  estimated_duration_min: z.number().int().positive().optional(),
});
export type ConfirmWorkRequestPayload = z.infer<typeof confirmWorkRequestSchema>;
