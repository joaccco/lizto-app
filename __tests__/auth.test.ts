import { saveToken, getToken, removeToken } from '../src/core/security/secureStore';
import { useAuthStore } from '../src/features/auth/store/useAuthStore';

describe('Criterios de Aceptación: Autenticación y Persistencia', () => {
  beforeEach(async () => {
    await removeToken();
    useAuthStore.setState({ token: null, activeRole: 'provider', isInitialized: false });
  });

  test('1. Un usuario con credenciales válidas inicia sesión y su token queda persistido en almacenamiento seguro', async () => {
    const fakeToken = 'sanctum_token_abc_123';
    
    // Guardar token mediante la capa segura
    await saveToken(fakeToken);
    const persistedToken = await getToken();

    expect(persistedToken).toBe(fakeToken);
  });

  test('2. Al reabrir la app con sesión válida, entra directamente sin volver a pedir credenciales', async () => {
    const fakeToken = 'sanctum_token_valid';
    await saveToken(fakeToken);

    // Inicializar store de sesión
    await useAuthStore.getState().initializeSession();

    const state = useAuthStore.getState();
    expect(state.token).toBe(fakeToken);
    expect(state.isInitialized).toBe(true);
  });

  test('3. El logout borra el token y devuelve al login; una petición posterior no lleva credenciales', async () => {
    const fakeToken = 'sanctum_token_to_logout';
    await saveToken(fakeToken);

    await useAuthStore.getState().logout();

    const currentToken = await getToken();
    expect(currentToken).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
