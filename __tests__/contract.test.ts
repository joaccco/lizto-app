import { sessionRedirect } from '@/core/navigation/sessionRoute';
import { ApiContractError } from '../src/core/api/httpClient';
import { userSchema } from '../src/features/auth/schemas/authSchema';
import { confirmWorkRequestSchema } from '../src/features/offers/schemas/confirmRequestSchema';

describe('Criterios de Aceptación: Validación de Contratos y Control de Rutas', () => {
  test('4. Una respuesta de la API que no cumple el esquema esperado produce un error identificable en el borde', () => {
    const invalidApiResponse = {
      id: 'uuid-123',
      name: 'Juan Perez',
      // email es requerido pero viene inválido o ausente
      email: 'not-an-email',
      roles: 'provider', // debería ser un array de strings
    };

    const parseResult = userSchema.safeParse(invalidApiResponse);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const contractError = new ApiContractError(parseResult.error, '/v1/auth/me');
      expect(contractError.name).toBe('ApiContractError');
      expect(contractError.message).toContain('CONTRACT_ERROR');
    }
  });

  test('6. Un usuario sin rol de profesional no puede alcanzar las rutas del grupo profesional', () => {
    expect(sessionRedirect({ token: 'session', role: 'client', group: '(pro)' })).toBe('/(cliente)');
  });

  test('7. confirmWorkRequestSchema valida payload tipado y descarta el campo notes', () => {
    const payload = {
      notes: 'No permitido en este contrato',
      proposed_price: 15000,
      scheduled_at: '2026-08-25T10:00:00.000Z',
      estimated_duration_min: 60,
    };

    const parseResult = confirmWorkRequestSchema.safeParse(payload);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.proposed_price).toBe(15000);
      expect(parseResult.data).not.toHaveProperty('notes');
    }
  });
});
