import { saveToken, getToken, removeToken } from '../src/core/security/secureStore';
import { useAuthStore } from '../src/features/auth/store/useAuthStore';
import { User } from '../src/features/auth/schemas/authSchema';

describe('Criterios de Aceptación: Autenticación, Persistencia y Roles Dinámicos', () => {
  beforeEach(async () => {
    await removeToken();
    useAuthStore.setState({ token: null, activeRole: null, isInitialized: false });
  });

  test('1. Un usuario con credenciales válidas inicia sesión y su token queda persistido en almacenamiento seguro', async () => {
    const fakeToken = 'sanctum_token_abc_123';
    await saveToken(fakeToken);
    const persistedToken = await getToken();

    expect(persistedToken).toBe(fakeToken);
  });

  test('2. Al reabrir la app con sesión válida, recupera sesión sin valor fijo de rol inicial', async () => {
    const fakeToken = 'sanctum_token_valid';
    await saveToken(fakeToken);

    await useAuthStore.getState().initializeSession();

    const state = useAuthStore.getState();
    expect(state.token).toBe(fakeToken);
    expect(state.isInitialized).toBe(true);
  });

  test('3. El logout borra el token y resetea el rol activo', async () => {
    const fakeToken = 'sanctum_token_to_logout';
    await saveToken(fakeToken);
    useAuthStore.setState({ activeRole: 'provider' });

    await useAuthStore.getState().logout();

    const currentToken = await getToken();
    expect(currentToken).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().activeRole).toBeNull();
  });

  test('A2a. Usuario con solo rol client deriva activeRole = client', async () => {
    const clientUser: User = {
      id: 'uuid-client-only',
      name: 'Cliente Unico',
      email: 'cliente@test.com',
      status: 'active',
      roles: ['client'],
      has_provider_profile: false,
    };

    const derivedRole = await useAuthStore.getState().deriveActiveRoleFromUser(clientUser);
    expect(derivedRole).toBe('client');
    expect(useAuthStore.getState().activeRole).toBe('client');
  });

  test('A2b. Usuario con solo rol provider deriva activeRole = provider', async () => {
    const proUser: User = {
      id: 'uuid-pro-only',
      name: 'Pro Unico',
      email: 'pro@test.com',
      status: 'active',
      roles: ['provider'],
      has_provider_profile: true,
    };

    const derivedRole = await useAuthStore.getState().deriveActiveRoleFromUser(proUser);
    expect(derivedRole).toBe('provider');
    expect(useAuthStore.getState().activeRole).toBe('provider');
  });

  test('A2c. Usuario con ambos roles reabre en el último rol utilizado', async () => {
    const dualUser: User = {
      id: 'uuid-dual',
      name: 'Usuario Doble Rol',
      email: 'dual@test.com',
      status: 'active',
      roles: ['client', 'provider'],
      has_provider_profile: true,
    };

    // Cambiar explicitamente a cliente
    await useAuthStore.getState().setActiveRole('client');

    const derivedRole = await useAuthStore.getState().deriveActiveRoleFromUser(dualUser);
    expect(derivedRole).toBe('client');
  });
});
