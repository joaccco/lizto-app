import { httpClient } from '@/core/api/httpClient';
import { z } from 'zod';
import { CreateOfferFormData, AskQuestionFormData } from '../schemas/offerSchema';

const offerResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    status: z.string(),
    pricing_mode: z.string(),
    proposed_price: z.number().nullable().optional(),
    price_min: z.number().nullable().optional(),
    price_max: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    currency_code: z.string(),
    round_number: z.number(),
  }),
  message: z.string(),
});

const askQuestionResponseSchema = z.object({
  data: z.object({
    id: z.number().or(z.string()),
    question_text: z.string().optional(),
  }),
  message: z.string(),
});

const actionResponseSchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

export const offersApi = {
  /**
   * Creación de oferta para una solicitud de trabajo
   * POST /v1/service-requests/{id}/offers
   */
  async store(serviceRequestId: string, data: CreateOfferFormData) {
    const payload: Record<string, any> = {
      pricing_mode: data.pricing_mode,
      currency_code: data.currency_code || 'ARS',
    };

    if (data.pricing_mode === 'quoted') {
      if (data.proposed_price !== undefined && data.proposed_price !== null) {
        payload.proposed_price = data.proposed_price;
      }
    } else if (data.pricing_mode === 'requires_visit') {
      if (data.price_min !== undefined && data.price_min !== null) {
        payload.price_min = data.price_min;
      }
      if (data.price_max !== undefined && data.price_max !== null) {
        payload.price_max = data.price_max;
      }
    }

    if (data.proposed_start_at) {
      payload.proposed_start_at = data.proposed_start_at;
    }
    if (data.estimated_duration_min) {
      payload.estimated_duration_min = data.estimated_duration_min;
    }
    if (data.notes) {
      payload.notes = data.notes;
    }

    return httpClient.post(
      `/v1/service-requests/${serviceRequestId}/offers`,
      offerResponseSchema,
      payload
    );
  },

  /**
   * Enviar pregunta aclaratoria previa o posterior a la oferta
   * POST /v1/offers/{id}/questions
   */
  async askQuestion(offerOrRequestId: string, data: AskQuestionFormData) {
    return httpClient.post(
      `/v1/offers/${offerOrRequestId}/questions`,
      askQuestionResponseSchema,
      {
        question_key: 'general_question',
        question_text: data.question_text,
      }
    );
  },

  /**
   * Confirmar solicitud de trabajo como profesional
   * POST /v1/provider/work-requests/{id}/confirm
   */
  async confirmRequest(id: string, payload: any) {
    return httpClient.post(
      `/v1/provider/work-requests/${id}/confirm`,
      actionResponseSchema,
      payload
    );
  },

  /**
   * Descartar / declinar solicitud de trabajo
   * POST /v1/provider/work-requests/{id}/decline
   */
  async declineRequest(id: string) {
    return httpClient.post(
      `/v1/provider/work-requests/${id}/decline`,
      actionResponseSchema
    );
  },
};
