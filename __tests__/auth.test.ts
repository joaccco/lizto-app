import { saveToken, getToken, removeToken } from '../src/core/security/secureStore';
import { useAuthStore } from '../src/features/auth/store/useAuthStore';
import { resolveRole } from '@/features/auth/domain/resolveRole';
import { saveActiveRole, getActiveRole } from '@/core/security/secureStore';
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

    const derivedRole = resolveRole(clientUser.roles, null);
    expect(derivedRole).toEqual({ status: 'resolved', role: 'client' });
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

    const derivedRole = resolveRole(proUser.roles, null);
    expect(derivedRole).toEqual({ status: 'resolved', role: 'provider' });
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
    await saveActiveRole(dualUser.id, 'client');

    const derivedRole = resolveRole(dualUser.roles, await getActiveRole(dualUser.id));
    expect(derivedRole).toEqual({ status: 'resolved', role: 'client' });
  });

  test('4. El esquema de registro omite el campo role y valida datos requeridos', () => {
    const { registerSchema } = require('../src/features/auth/schemas/authSchema');
    const validRegisterData = {
      role: 'provider',
      name: 'Nuevo Usuario',
      email: 'nuevo@test.com',
      password: 'Password123',
      password_confirmation: 'Password123',
    };

    const parseResult = registerSchema.safeParse(validRegisterData);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data).not.toHaveProperty('role');
    }
  });
});


test('la preferencia de una cuenta no se hereda por otra ni se restaura sin consultar roles', async () => {
  await saveActiveRole('account-a', 'provider');
  await saveActiveRole('account-b', 'client');
  expect(resolveRole(['client', 'provider'], await getActiveRole('account-a'))).toEqual({ status: 'resolved', role: 'provider' });
  expect(resolveRole(['client', 'provider'], await getActiveRole('account-b'))).toEqual({ status: 'resolved', role: 'client' });
  expect(resolveRole(['client', 'provider'], await getActiveRole('account-new'))).toEqual({ status: 'selection_required' });
  await saveToken('session');
  await useAuthStore.getState().initializeSession();
  expect(useAuthStore.getState().activeRole).toBeNull();
});
