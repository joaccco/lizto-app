import { z } from 'zod';
import { currencySchema, minorAmountSchema } from '@/core/domain/money';
import { instantSchema } from '@/core/domain/time';

export const pricingModeEnum = z.enum(['quoted', 'requires_visit']);
export type PricingMode = z.infer<typeof pricingModeEnum>;

// Todos los importes en la app están en centavos, incluido proposed_price.
export const createOfferSchema = z.object({
  pricing_mode: pricingModeEnum,
  proposed_price: minorAmountSchema.positive().nullable().optional(),
  price_min: minorAmountSchema.nullable().optional(),
  price_max: minorAmountSchema.nullable().optional(),
  currency_code: currencySchema,
  proposed_start_at: instantSchema.nullable().optional(),
  estimated_duration_min: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.pricing_mode === 'quoted') {
    if (data.proposed_price == null) ctx.addIssue({ code: 'custom', path: ['proposed_price'], message: 'offers.invalidPrice' });
    if (data.price_min != null || data.price_max != null) ctx.addIssue({ code: 'custom', path: ['price_min'], message: 'offers.invalidRange' });
  } else {
    if (data.proposed_price != null) ctx.addIssue({ code: 'custom', path: ['proposed_price'], message: 'offers.invalidPrice' });
    if (data.price_min == null || data.price_max == null || data.price_min > data.price_max) ctx.addIssue({ code: 'custom', path: ['price_min'], message: 'offers.invalidRange' });
  }
});
export type CreateOfferFormData = z.infer<typeof createOfferSchema>;
export const askQuestionSchema = z.object({ question_text: z.string().trim().min(1) });
export type AskQuestionFormData = z.infer<typeof askQuestionSchema>;
