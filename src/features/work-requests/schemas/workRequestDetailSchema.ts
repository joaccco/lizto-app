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
  address: z.string().nullable().optional(), // Backend raw address (e.g. "San Martín 450")
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

/**
 * Sanitizador de Privacidad de Ubicación: extrae ÚNICAMENTE la zona aproximada o barrio.
 * NUNCA retorna la dirección exacta ni la altura de la calle.
 */
export function getApproximateZone(rawAddress?: string | null): string {
  if (!rawAddress) return 'Centro / Zona aproximada';
  
  // Si la dirección tiene comas (e.g., "Palermo, Ciudad Autónoma de Buenos Aires"), tomar la primera parte o barrio
  const parts = rawAddress.split(',').map((p) => p.trim());
  const firstPart = parts[0];

  // Si contiene números de calle (e.g., "San Martín 450"), remover los números para no exponer dirección exacta
  const zoneName = firstPart.replace(/\d+/g, '').trim();

  return zoneName.length > 2 ? zoneName : 'Zona aproximada';
}
