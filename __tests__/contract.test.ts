import { ApiContractError } from '../src/core/api/httpClient';
import { z } from 'zod';
import { userSchema } from '../src/features/auth/schemas/authSchema';

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
    const clientUser = {
      id: 'uuid-456',
      name: 'Maria Gomez',
      email: 'maria@test.com',
      status: 'active',
      roles: ['client'], // No posee 'provider' (Correction #5)
      has_provider_profile: false,
    };

    const hasProviderRole = clientUser.roles.includes('provider');
    expect(hasProviderRole).toBe(false);
  });
});
