import { httpClient } from '@/core/api/httpClient';
import { z } from 'zod';
import { minorAmountSchema, currencySchema, parseDecimalToMoney, toBackendDecimal } from '@/core/domain/money';
import { instantSchema } from '@/core/domain/time';
import { CreateOfferFormData, AskQuestionFormData, createOfferSchema, askQuestionSchema, pricingModeEnum } from '../schemas/offerSchema';
import { ConfirmWorkRequestPayload, confirmWorkRequestSchema } from '../schemas/confirmRequestSchema';

const legacyDecimalSchema = z.union([z.string(), z.number()]).transform((value, ctx) => {
  try { return parseDecimalToMoney(value).amountInCents; }
  catch { ctx.addIssue({ code: 'custom', message: 'MONEY_CONTRACT_ERROR' }); return z.NEVER; }
});
const offerResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(), status: z.string(), pricing_mode: pricingModeEnum,
    proposed_price: legacyDecimalSchema.nullable(),
    price_min: minorAmountSchema.nullable(), price_max: minorAmountSchema.nullable(),
    notes: z.string().nullable(), currency_code: currencySchema,
    round_number: z.number().int().positive(),
  }),
  message: z.string(),
});
const askQuestionResponseSchema = z.object({
  // El backend expone ID numérico de pregunta. Se descarta porque la app no lo utiliza.
  data: z.object({ question_text: z.string() }), message: z.string(),
});
const declineResponseSchema = z.object({
  data: z.object({ id: z.string().uuid(), status: z.literal('declined') }), message: z.string(),
});
const confirmResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(), work_id: z.string().uuid(), conversation_id: z.string().uuid().nullable(),
    status: z.literal('confirmed'), estimated_duration_min: z.number().int().positive().nullable(),
    scheduled_at: instantSchema.nullable(),
  }), message: z.string(),
});

export const offersApi = {
  async store(serviceRequestId: string, data: CreateOfferFormData) {
    z.string().uuid().parse(serviceRequestId);
    const validated = createOfferSchema.parse(data);
    // Deuda backend: quoted es decimal de unidades mayores; los rangos YA son centavos.
    const payload = { ...validated, proposed_price: validated.proposed_price == null ? undefined : toBackendDecimal(validated.proposed_price) };
    return httpClient.post(`/service-requests/${serviceRequestId}/offers`, offerResponseSchema, payload);
  },
  async askQuestion(offerId: string, data: AskQuestionFormData) {
    z.string().uuid().parse(offerId);
    const validated = askQuestionSchema.parse(data);
    return httpClient.post(`/offers/${offerId}/questions`, askQuestionResponseSchema, { question_key: 'general_question', ...validated });
  },
  async confirmRequest(id: string, data?: ConfirmWorkRequestPayload) {
    z.string().uuid().parse(id);
    const validated = confirmWorkRequestSchema.parse(data ?? {});
    return httpClient.post(`/provider/work-requests/${id}/confirm`, confirmResponseSchema, {
      ...validated, proposed_price: validated.proposed_price == null ? undefined : toBackendDecimal(validated.proposed_price),
    });
  },
  async declineRequest(id: string) {
    z.string().uuid().parse(id);
    return httpClient.post(`/provider/work-requests/${id}/decline`, declineResponseSchema);
  },
};
