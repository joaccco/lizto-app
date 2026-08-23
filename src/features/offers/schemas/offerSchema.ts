import { z } from 'zod';

export const pricingModeEnum = z.enum(['quoted', 'requires_visit']);
export type PricingMode = z.infer<typeof pricingModeEnum>;

export const createOfferSchema = z.object({
  pricing_mode: pricingModeEnum.default('quoted'),
  proposed_price: z.number().nullable().optional(),
  price_range_min: z.number().nullable().optional(),
  price_range_max: z.number().nullable().optional(),
  currency_code: z.string().default('ARS'),
  proposed_start_at: z.string().nullable().optional(),
  estimated_duration_min: z.number().min(15, 'La duración mínima es de 15 minutos').default(60),
  note: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.pricing_mode === 'quoted') {
    if (data.proposed_price === undefined || data.proposed_price === null || data.proposed_price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proposed_price'],
        message: 'El precio propuesto es obligatorio para ofertas con monto fijo.',
      });
    }
  } else if (data.pricing_mode === 'requires_visit') {
    if (data.price_range_min && data.price_range_max && data.price_range_min > data.price_range_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price_range_max'],
        message: 'El precio máximo del rango debe ser mayor o igual al mínimo.',
      });
    }
  }
});

export type CreateOfferFormData = z.infer<typeof createOfferSchema>;

export const askQuestionSchema = z.object({
  question_text: z.string().min(5, 'La pregunta debe tener al menos 5 caracteres'),
});

export type AskQuestionFormData = z.infer<typeof askQuestionSchema>;

/**
 * Validador helper para comprobar si una hora propuesta (HH:mm o ISO) cae dentro de la ventana del cliente
 */
export function isTimeWithinWindow(
  proposedTimeOrIso: string | null | undefined,
  windowStart: string | null | undefined,
  windowEnd: string | null | undefined
): boolean {
  if (!proposedTimeOrIso || !windowStart || !windowEnd) return true;

  try {
    let hours = 0;
    let minutes = 0;

    if (proposedTimeOrIso.includes('T')) {
      const timePart = proposedTimeOrIso.split('T')[1];
      const [hStr, mStr] = timePart.split(':');
      hours = parseInt(hStr, 10);
      minutes = parseInt(mStr, 10);
    } else {
      const [hStr, mStr] = proposedTimeOrIso.split(':');
      hours = parseInt(hStr, 10);
      minutes = parseInt(mStr, 10);
    }

    const proposedTotalMinutes = hours * 60 + (minutes || 0);

    const [startH, startM] = windowStart.split(':').map(Number);
    const [endH, endM] = windowEnd.split(':').map(Number);

    const startTotalMinutes = startH * 60 + (startM || 0);
    const endTotalMinutes = endH * 60 + (endM || 0);

    return proposedTotalMinutes >= startTotalMinutes && proposedTotalMinutes <= endTotalMinutes;
  } catch {
    return true;
  }
}
