import { z } from 'zod';

export const confirmWorkRequestSchema = z.object({
  proposed_price: z.number().positive('El precio debe ser un monto positivo').optional(),
  scheduled_at: z.string().optional(),
  estimated_duration_min: z.number().int().min(15, 'La duración mínima es de 15 minutos').optional(),
});

export type ConfirmWorkRequestPayload = z.infer<typeof confirmWorkRequestSchema>;
