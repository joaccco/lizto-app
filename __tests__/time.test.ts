import {
  ensureExplicitTimezoneISO,
  compareInstants,
  formatToArgentinaTime,
} from '../src/core/domain/time';

describe('Criterios de Aceptación: Invariante de Tiempo y Zonas Horarias (ADR-010)', () => {
  test('Acepta instantes con offset UTC (Z) o desfasaje explícito', () => {
    const utcTime = '2026-08-21T20:00:00.000Z';
    const offsetTime = '2026-08-21T17:00:00.000-03:00';

    expect(ensureExplicitTimezoneISO(utcTime)).toBe(utcTime);
    expect(ensureExplicitTimezoneISO(offsetTime)).toBe(offsetTime);
  });

  test('Falla explícitamente si un instante no posee zona horaria ni offset', () => {
    const naiveLocalTime = '2026-08-21 20:00:00';

    expect(() => ensureExplicitTimezoneISO(naiveLocalTime)).toThrow('TIME_ERROR');
    expect(() => compareInstants(naiveLocalTime, '2026-08-21T20:00:00.000Z')).toThrow('TIME_ERROR');
  });

  test('Compara instantes absolutos correctamente independientemente de offsets', () => {
    const instant1 = '2026-08-21T20:00:00.000Z';
    const instant2 = '2026-08-21T17:00:00.000-03:00'; // Mismo instante absoluto en UTC-3

    expect(compareInstants(instant1, instant2)).toBe(0);
  });

  test('Formatea el instante a la zona horaria America/Argentina/Buenos_Aires para presentación', () => {
    const utcInstant = '2026-08-21T20:00:00.000Z';
    const formatted = formatToArgentinaTime(utcInstant, 'HH:mm');

    // 20:00 UTC es 17:00 en Buenos Aires (UTC-3)
    expect(formatted).toBe('17:00');
  });
});
