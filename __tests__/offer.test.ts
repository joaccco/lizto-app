import {
  createOfferSchema,
  isTimeWithinWindow,
} from '@/features/offers/schemas/offerSchema';
import { getApproximateZone } from '@/features/work-requests/schemas/workRequestDetailSchema';

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
  });

  describe('Criterio 2: Oferta con requerimiento de visita técnica (requires_visit)', () => {
    test('Acepta oferta con visita técnica y rango estimativo válido (min < max)', () => {
      const validVisitData = {
        pricing_mode: 'requires_visit',
        price_range_min: 10000,
        price_range_max: 25000,
        estimated_duration_min: 90,
      };

      const result = createOfferSchema.safeParse(validVisitData);
      expect(result.success).toBe(true);
    });

    test('Rechaza oferta con visita técnica si rango mínimo > máximo', () => {
      const invalidVisitData = {
        pricing_mode: 'requires_visit',
        price_range_min: 30000,
        price_range_max: 15000,
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

  describe('Criterio 4: Protección de Privacidad de Dirección Exacta', () => {
    test('Sanitiza y remueve la altura y dirección exacta, retornando solo la zona o barrio', () => {
      const zone1 = getApproximateZone('San Martín 450, Palermo, CABA');
      expect(zone1).not.toContain('450');
      expect(zone1).toBe('San Martín');

      const zone2 = getApproximateZone('Av. Cabildo 1234');
      expect(zone2).not.toContain('1234');
      expect(zone2).toBe('Av. Cabildo');
    });

    test('Retorna un fallback seguro si no hay dirección', () => {
      const zone = getApproximateZone(null);
      expect(zone).toBe('Centro / Zona aproximada');
    });
  });
});
