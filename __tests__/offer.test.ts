import {
  createOfferSchema,
  isTimeWithinWindow,
} from '@/features/offers/schemas/offerSchema';
import { workRequestDetailSchema } from '@/features/work-requests/schemas/workRequestDetailSchema';

describe('Criterios de Aceptación: Motor de Ofertas y Reglas de Dominio', () => {
  describe('Criterio 1: Oferta con monto fijo (quoted)', () => {
    test('Acepta una oferta válida con monto fijo exacto', () => {
      const validData = {
        pricing_mode: 'quoted',
        proposed_price: 18000,
        currency_code: 'ARS',
        estimated_duration_min: 60,
      };

      const result = createOfferSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('Rechaza una oferta con monto fijo sin importe o con precio <= 0', () => {
      const invalidData = {
        pricing_mode: 'quoted',
        proposed_price: 0,
      };

      const result = createOfferSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('Rechaza oferta con monto fijo si se envían price_min o price_max', () => {
      const invalidData = {
        pricing_mode: 'quoted',
        proposed_price: 18000,
        price_min: 10000,
        price_max: 20000,
      };

      const result = createOfferSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Criterio 2: Oferta con requerimiento de visita técnica (requires_visit)', () => {
    test('Acepta oferta con visita técnica y rango estimativo válido (min < max)', () => {
      const validVisitData = {
        pricing_mode: 'requires_visit',
        price_min: 10000,
        price_max: 25000,
        estimated_duration_min: 90,
      };

      const result = createOfferSchema.safeParse(validVisitData);
      expect(result.success).toBe(true);
    });

    test('Rechaza oferta con visita técnica si rango mínimo > máximo', () => {
      const invalidVisitData = {
        pricing_mode: 'requires_visit',
        price_min: 30000,
        price_max: 15000,
      };

      const result = createOfferSchema.safeParse(invalidVisitData);
      expect(result.success).toBe(false);
    });

    test('Rechaza oferta con visita técnica si se envía proposed_price', () => {
      const invalidVisitData = {
        pricing_mode: 'requires_visit',
        proposed_price: 15000,
        price_min: 10000,
        price_max: 25000,
      };

      const result = createOfferSchema.safeParse(invalidVisitData);
      expect(result.success).toBe(false);
    });
  });

  describe('Criterio 3: Validación de ventana horaria solicitada', () => {
    test('Acepta un horario propuesto dentro de la ventana solicitada', () => {
      const isWithin = isTimeWithinWindow('2026-08-25T10:30:00.000Z', '09:00', '13:00');
      expect(isWithin).toBe(true);
    });

    test('Rechaza un horario propuesto fuera de la ventana solicitada', () => {
      const isWithin = isTimeWithinWindow('2026-08-25T15:00:00.000Z', '09:00', '13:00');
      expect(isWithin).toBe(false);
    });
  });

  describe('Criterio 4: Ubicación aproximada desde el servidor', () => {
    test('Valida correctamente campos is_approximate y location_radius_meters del servidor', () => {
      const serverResponse = {
        id: 'req-123',
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        raw_prompt: 'Reparación de filtración',
        status: 'pending_matching',
        urgency: 'normal',
        location_address: 'Palermo',
        is_approximate: true,
        location_radius_meters: 500,
        created_at: '2026-08-22T20:00:00.000Z',
      };

      const parseResult = workRequestDetailSchema.safeParse(serverResponse);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.is_approximate).toBe(true);
        expect(parseResult.data.location_radius_meters).toBe(500);
      }
    });
  });
});
