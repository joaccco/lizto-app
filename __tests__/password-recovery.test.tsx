import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PasswordRecoveryScreen from '@/features/auth/recovery/PasswordRecoveryScreen';
import { recoveryResetSchema } from '@/features/auth/recovery/passwordRecovery';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import i18n from '@/core/i18n';
import '@/core/i18n';
const fetchMock = jest.fn();
const oldFetch = global.fetch;
const mockReplace = jest.fn();
const profile = { id: '0b29b2c0-28c2-44cf-bbdd-279fe0e7bc8b', name: 'Prueba', email: 'persona@example.test', status: 'active', roles: ['client', 'provider'], has_provider_profile: false };
const session = { data: { user: profile, token: 'reset-session' }, message: 'changed' };
function accepted() { return { message: 'accepted', data: { retry_at: new Date(Date.now() + 60_000).toISOString() } }; }
const grant = { data: { reset_token: 'a'.repeat(64), expires_at: '2030-01-01T00:00:00Z' } };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
function reply(status: number, body: unknown) { return { ok: status < 400, status, json: async () => body }; }
function screen() {
 const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
 return render(<QueryClientProvider client={client}><PasswordRecoveryScreen /></QueryClientProvider>);
}
beforeEach(async () => {
 jest.clearAllMocks(); fetchMock.mockReset(); global.fetch = fetchMock;
 await useAuthStore.getState().logout();
 if (!Constants.expoConfig) throw new Error('Missing config');
 Constants.expoConfig.extra = { apiUrl: 'http://localhost:8000/api/v1' };
});
afterEach(() => { global.fetch = oldFetch; });
async function send(view: ReturnType<typeof screen>) {
 fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'persona@example.test');
 fireEvent.press(view.getByText('Enviar código'));
 await view.findByLabelText('Código de 6 dígitos');
}
async function verify(view: ReturnType<typeof screen>) {
 fireEvent.changeText(view.getByLabelText('Código de 6 dígitos'), '123456');
 fireEvent.press(view.getByText('Verificar código'));
 await view.findByLabelText('Nueva contraseña');
}
test('primero verifica código y luego envía contraseña sólo con el permiso temporal de API', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(200, grant)).mockResolvedValueOnce(reply(200, session));
 const view = screen(); await send(view);
 expect(view.queryByLabelText('Nueva contraseña')).toBeNull();
 await verify(view);
 expect(view.queryByLabelText('Código de 6 dígitos')).toBeNull();
 fireEvent.changeText(view.getByLabelText('Nueva contraseña'), 'Changed1');
 fireEvent.changeText(view.getByLabelText('Confirmá la contraseña'), 'Changed1');
 fireEvent.press(view.getByText('Cambiar contraseña'));
 expect(await view.findByText('Contraseña actualizada')).toBeTruthy();
 expect(fetchMock.mock.calls.map(c => c[0].split('/').pop())).toEqual(['forgot-password','verify-password-code','reset-password']);
 expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ email: 'persona@example.test', code: '123456' });
 expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ email: 'persona@example.test', reset_token: grant.data.reset_token, password: 'Changed1', password_confirmation: 'Changed1' });
 expect(fetchMock.mock.calls[2][1].headers.Authorization).toBeUndefined();
 expect(useAuthStore.getState().token).toBe('reset-session');
 expect(mockReplace).not.toHaveBeenCalled();
});
test('código incorrecto nunca muestra contraseña y permite corregirlo antes de avanzar', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(422, { code: 'password_recovery_invalid' })).mockResolvedValueOnce(reply(200, grant));
 const view = screen(); await send(view);
 fireEvent.changeText(view.getByLabelText('Código de 6 dígitos'), '111111'); fireEvent.press(view.getByText('Verificar código'));
 expect(await view.findByText('El código no es válido o venció. Revisalo o solicitá uno nuevo.')).toBeTruthy();
 expect(view.queryByLabelText('Nueva contraseña')).toBeNull();
 expect(view.getByLabelText('Código de 6 dígitos').props.value).toBe('111111');
 await verify(view); expect(view.getByLabelText('Nueva contraseña')).toBeTruthy();
});
test('espera la verificación del servidor y no duplica solicitudes por pulsaciones repetidas', async () => {
 let finish: ((value: ReturnType<typeof reply>) => void) | undefined;
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
 const view = screen(); await send(view);
 fireEvent.changeText(view.getByLabelText('Código de 6 dígitos'), '123456');
 fireEvent.press(view.getByText('Verificar código')); fireEvent.press(view.getByText('Verificar código'));
 await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
 expect(view.queryByLabelText('Nueva contraseña')).toBeNull();
 await act(async () => { finish?.(reply(200, grant)); });
 expect(await view.findByLabelText('Nueva contraseña')).toBeTruthy();
});
test('respuesta de verificación sin permiso válido falla en el borde sin habilitar contraseña', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(200, { data: { reset_token: 'invalid' } }));
 const view = screen(); await send(view);
 fireEvent.changeText(view.getByLabelText('Código de 6 dígitos'), '123456'); fireEvent.press(view.getByText('Verificar código'));
 expect(await view.findByText('No pudimos procesar la solicitud. Revisá tu conexión e intentá nuevamente.')).toBeTruthy();
 expect(view.queryByLabelText('Nueva contraseña')).toBeNull();
});
test('fallo de envío conserva email y no filtra detalles del servidor', async () => {
 fetchMock.mockResolvedValueOnce(reply(503, { message: 'smtp secret' }));
 const view = screen(); fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'persona@example.test'); fireEvent.press(view.getByText('Enviar código'));
 expect(await view.findByText('No pudimos procesar la solicitud. Revisá tu conexión e intentá nuevamente.')).toBeTruthy();
 expect(view.queryByLabelText('Código de 6 dígitos')).toBeNull(); expect(view.queryByText('smtp secret')).toBeNull();
 expect(view.getByLabelText('Correo electrónico').props.value).toBe('persona@example.test');
});
test('permiso vencido conserva contraseña y ofrece solicitar otro código', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(200, grant)).mockResolvedValueOnce(reply(422, { code: 'password_recovery_invalid' }));
 const view = screen(); await send(view); await verify(view);
 fireEvent.changeText(view.getByLabelText('Nueva contraseña'), 'Changed1'); fireEvent.changeText(view.getByLabelText('Confirmá la contraseña'), 'Changed1');
 fireEvent.press(view.getByText('Cambiar contraseña'));
 expect(await view.findByText('La verificación venció o ya se utilizó. Solicitá otro código para continuar.')).toBeTruthy();
 expect(view.getByLabelText('Nueva contraseña').props.value).toBe('Changed1');
 fireEvent.press(view.getByText('Solicitar otro código o cambiar email'));
 expect(view.queryByLabelText('Nueva contraseña')).toBeNull(); expect(view.getByLabelText('Correo electrónico')).toBeTruthy();
});
test('envío inicial simultáneo no duplica solicitudes', async () => {
 let finish: ((value: ReturnType<typeof reply>) => void) | undefined;
 fetchMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
 const view = screen(); fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'persona@example.test');
 fireEvent.press(view.getByText('Enviar código')); fireEvent.press(view.getByText('Enviar código'));
 await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
 await act(async () => { finish?.(reply(202, accepted())); });
});
test.each(['short1A', 'lowercase1', 'Nonumbers', 'Changed1'])('rechaza contraseña o confirmación inválida (%s)', password => {
 expect(recoveryResetSchema.safeParse({ email: 'persona@example.test', reset_token: grant.data.reset_token, password, password_confirmation: password === 'Changed1' ? 'Changed2' : password }).success).toBe(false);
});

test('la espera de servidor se conserva al volver y bloquea otro envío hasta que vence sin polling', async () => {
 jest.useFakeTimers();
 jest.setSystemTime(new Date('2026-10-21T20:00:00Z'));
 try {
  fetchMock.mockResolvedValueOnce(reply(202, accepted()));
  const view = screen(); await send(view);
  fireEvent.press(view.getByText('Solicitar otro código o cambiar email'));
  expect(view.getByLabelText('Correo electrónico').props.value).toBe('persona@example.test');
  expect(view.getByText('Podés pedir otro código en 1:00.')).toBeTruthy();
  fireEvent.press(view.getByText('Enviar código'));
  await act(async () => {});
  expect(fetchMock).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(59_000));
  expect(view.getByText('Podés pedir otro código en 0:01.')).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(1000));
  fetchMock.mockResolvedValueOnce(reply(202, accepted()));
  fireEvent.press(view.getByText('Enviar código'));
  await view.findByLabelText('Código de 6 dígitos');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  view.unmount();
 } finally { jest.useRealTimers(); }
});

test('un límite de servidor al volver sin caché muestra la espera y no permite repetir solicitudes', async () => {
 fetchMock.mockResolvedValueOnce(reply(429, { code: 'password_recovery_throttled', data: { retry_at: new Date(Date.now() + 120_000).toISOString() } }));
 const view = screen();
 fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'persona@example.test');
 fireEvent.press(view.getByText('Enviar código'));
 expect(await view.findByText(/Podés pedir otro código en 2:00/)).toBeTruthy();
 fireEvent.press(view.getByText('Enviar código'));
 await act(async () => {});
 expect(fetchMock).toHaveBeenCalledTimes(1);
 expect(view.queryByLabelText('Código de 6 dígitos')).toBeNull();
 view.unmount();
});

test('una respuesta de cambio sin sesión válida no inicia sesión sólo por coincidir las contraseñas', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(200, grant)).mockResolvedValueOnce(reply(200, { message: 'changed' }));
 const view = screen(); await send(view); await verify(view);
 fireEvent.changeText(view.getByLabelText('Nueva contraseña'), 'Changed1'); fireEvent.changeText(view.getByLabelText('Confirmá la contraseña'), 'Changed1');
 fireEvent.press(view.getByText('Cambiar contraseña'));
 expect(await view.findByText('No pudimos procesar la solicitud. Revisá tu conexión e intentá nuevamente.')).toBeTruthy();
 expect(useAuthStore.getState().token).toBeNull();
});

 test('un fallo de Secure Store informa el error sin afirmar ingreso ni repetir el cambio consumido', async () => {
 fetchMock.mockResolvedValueOnce(reply(202, accepted())).mockResolvedValueOnce(reply(200, grant)).mockResolvedValueOnce(reply(200, session));
 const view = screen(); await send(view); await verify(view);
 jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('device storage failed'));
 fireEvent.changeText(view.getByLabelText('Nueva contraseña'), 'Changed1'); fireEvent.changeText(view.getByLabelText('Confirmá la contraseña'), 'Changed1');
 fireEvent.press(view.getByText('Cambiar contraseña'));
 expect(await view.findByText(i18n.t('auth.storageError'))).toBeTruthy();
 expect(useAuthStore.getState().token).toBeNull();
 expect(view.queryByText('Contraseña actualizada')).toBeNull();
 fireEvent.press(view.getByText('Cambiar contraseña'));
 await act(async () => {});
 expect(fetchMock).toHaveBeenCalledTimes(3);
 });
