import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import RegisterScreen from '@/features/auth/registration/RegisterScreen';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import i18n from '@/core/i18n';
const fetchMock = jest.fn();
const mockReplace = jest.fn();
const oldFetch = global.fetch;
const oldOS = Platform.OS;
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
const user = { id: '0b29b2c0-28c2-44cf-bbdd-279fe0e7bc8b', name: 'Persona nueva', email: 'nueva@example.test', status: 'active', roles: ['client'], has_provider_profile: false };
const result = { data: { user, token: 'registration-session' }, message: 'ok' };
function response(status: number, body: unknown) { return { status, ok: status < 400, json: async () => body }; }
function screen() {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
 return { ...render(<QueryClientProvider client={client}><RegisterScreen /></QueryClientProvider>), client };
}
function enter(view: ReturnType<typeof screen>, confirmation = 'Abcdefg1') {
 fireEvent.changeText(view.getByLabelText('Nombre'), 'Persona nueva');
 fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'nueva@example.test');
 fireEvent.changeText(view.getByLabelText('Contraseña'), 'Abcdefg1');
 fireEvent.changeText(view.getByLabelText('Confirmá la contraseña'), confirmation);
}
beforeEach(async () => {
 jest.clearAllMocks(); fetchMock.mockReset(); global.fetch = fetchMock;
 await useAuthStore.getState().logout();
 Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
 if (!Constants.expoConfig) throw new Error('Missing Expo config');
 Constants.expoConfig.extra = { apiUrl: 'http://localhost:8000/api/v1' };
});
afterEach(() => { global.fetch = oldFetch; Object.defineProperty(Platform, 'OS', { configurable: true, value: oldOS }); });
test('crea cuenta con cuatro campos reales y establece sesión en Secure Store sin decidir roles en pantalla', async () => {
 fetchMock.mockResolvedValueOnce(response(201, result));
 const view = screen(); view.client.setQueryData(['previous-account'], { private: true }); enter(view);
 fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 await waitFor(() => expect(useAuthStore.getState().token).toBe('registration-session'));
 expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/register$/);
 expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: 'Persona nueva', email: 'nueva@example.test', password: 'Abcdefg1', password_confirmation: 'Abcdefg1' });
 expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
 expect(SecureStore.setItemAsync).toHaveBeenCalledWith('lizto_auth_token', 'registration-session');
 expect(view.client.getQueryData(['previous-account'])).toBeUndefined();
 expect(useAuthStore.getState().activeRole).toBeNull();
 expect(mockReplace).not.toHaveBeenCalled();
});
test('email rechazado mantiene datos y permite corregir y reintentar sin mostrar detalles internos', async () => {
 fetchMock.mockResolvedValueOnce(response(422, { errors: { email: ['internal database detail'] } })).mockResolvedValueOnce(response(201, { ...result, data: { ...result.data, user: { ...user, email: 'otra@example.test' } } }));
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect((await view.findAllByText(i18n.t('registration.emailUnavailable'))).length).toBeGreaterThan(0);
 expect(view.queryByText('internal database detail')).toBeNull();
 expect(view.getByLabelText('Contraseña').props.value).toBe('Abcdefg1');
 expect(useAuthStore.getState().token).toBeNull();
 fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'otra@example.test'); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 await waitFor(() => expect(useAuthStore.getState().token).toBe('registration-session'));
 expect(JSON.parse(fetchMock.mock.calls[1][1].body).email).toBe('otra@example.test');
});
test('contraseña sin confirmar bloquea el alta antes de enviar datos', async () => {
 const view = screen(); enter(view, 'Different1'); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect(await view.findByText(i18n.t('validation.passwordMismatch'))).toBeTruthy();
 expect(fetchMock).not.toHaveBeenCalled(); expect(useAuthStore.getState().token).toBeNull();
});
test('doble pulsación durante alta produce una sola cuenta y una sola solicitud', async () => {
 let finish: ((value: ReturnType<typeof response>) => void) | undefined;
 fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' })); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
 await act(async () => { finish?.(response(201, result)); });
 await waitFor(() => expect(useAuthStore.getState().token).toBe('registration-session'));
});
test.each([429, 503])('HTTP %s no crea una sesión ni oculta los datos para reintentar', async status => {
 fetchMock.mockResolvedValueOnce(response(status, { message: 'internal error' }));
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect(await view.findByText(i18n.t(status === 429 ? 'auth.rateLimited' : 'registration.failed'))).toBeTruthy();
 expect(view.getByLabelText('Nombre').props.value).toBe('Persona nueva'); expect(useAuthStore.getState().token).toBeNull();
});
test('UUID inválido de API falla en el borde y nunca persiste el token devuelto', async () => {
 fetchMock.mockResolvedValueOnce(response(201, { ...result, data: { ...result.data, user: { ...user, id: null } } }));
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect(await view.findByText(i18n.t('registration.failed'))).toBeTruthy();
 expect(useAuthStore.getState().token).toBeNull(); expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});
test('fallo del almacenamiento reintenta guardar la sesión sin registrar otra cuenta', async () => {
 fetchMock.mockResolvedValueOnce(response(201, result));
 jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect(await view.findByText(i18n.t('registration.createdSessionFailed'))).toBeTruthy();
 expect(view.queryByLabelText('Contraseña')).toBeNull(); expect(useAuthStore.getState().token).toBeNull();
 fireEvent.press(view.getByRole('button', { name: 'Reintentar ingreso' }));
 await waitFor(() => expect(useAuthStore.getState().token).toBe('registration-session'));
 expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('web no crea una cuenta si no puede establecer la sesión nativa segura', async () => {
 Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
 const view = screen(); enter(view); fireEvent.press(view.getByRole('button', { name: 'Crear cuenta' }));
 expect(await view.findByText(i18n.t('registration.nativeRequired'))).toBeTruthy();
 expect(fetchMock).not.toHaveBeenCalled();
});
