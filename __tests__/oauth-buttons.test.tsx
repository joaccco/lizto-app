import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { authorizeNativeOAuth } from '@/features/auth/oauth/nativeOAuth';
import type { NativeOAuthResult } from '@/features/auth/oauth/oauthFlow';
import { ME_QUERY_KEY } from '@/features/auth/api/useMe';
import '@/core/i18n';

jest.mock('@/features/auth/oauth/nativeOAuth', () => ({ authorizeNativeOAuth: jest.fn() }));
const authorize = jest.mocked(authorizeNativeOAuth);
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const nonce = 'a'.repeat(64);
const profile = { id: '0b29b2c0-28c2-44cf-bbdd-279fe0e7bc8b', name: 'Prueba', email: 'qa@example.test', status: 'active', roles: ['client'], has_provider_profile: false };
function response(status: number, body: unknown) { return { ok: status < 400, status, json: async () => body }; }
function screen(mode: 'login' | 'link' = 'login') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (mode === 'link') client.setQueryData(ME_QUERY_KEY, { ...profile, linked_oauth_providers: [] });
  return render(<QueryClientProvider client={client}><OAuthButtons mode={mode} lock={{ current: false }} /></QueryClientProvider>);
}
beforeEach(async () => {
  jest.clearAllMocks(); fetchMock.mockReset(); global.fetch = fetchMock;
  await SecureStore.deleteItemAsync('lizto_auth_token');
  useAuthStore.setState({ token: null, storageError: null });
  if (!Constants.expoConfig) throw new Error('Missing Expo config');
  Constants.expoConfig.extra = { apiUrl: 'http://localhost:8000/api/v1', oauth: {
    google: { iosClientId: '123-ios.apps.googleusercontent.com', webClientId: '123-web.apps.googleusercontent.com' }, facebook: { appId: '123' },
  } };
  fetchMock.mockResolvedValueOnce(response(200, { data: { nonce, expires_at: '2030-01-01T00:00:00Z' } }));
  authorize.mockResolvedValue({ status: 'success', proof: { provider: 'google', kind: 'google_id_token', value: 'external-proof' } });
});
afterEach(() => { global.fetch = originalFetch; });

test('una credencial externa sola no establece sesión; sólo persiste el token de API', async () => {
  fetchMock.mockResolvedValueOnce(response(200, { data: { user: profile, token: 'lizto-token' }, message: 'ok' }));
  const view = screen(); fireEvent.press(view.getByLabelText('Continuar con Google'));
  await waitFor(() => expect(useAuthStore.getState().token).toBe('lizto-token'));
  expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith('lizto_auth_token', 'external-proof');
  expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/oauth\/login$/);
});

test('conflicto de email orienta a vincular sin crear sesión', async () => {
  fetchMock.mockResolvedValueOnce(response(409, { code: 'oauth_link_required', message: 'internal' }));
  const view = screen(); fireEvent.press(view.getByLabelText('Continuar con Google'));
  expect(await view.findByText(/Ese email ya tiene una cuenta Lizto/)).toBeTruthy();
  expect(useAuthStore.getState().token).toBeNull();
  expect(view.queryByText('internal')).toBeNull();
});

test.each(['google', 'facebook'] as const)('cancelar %s conserva el acceso cerrado y permite reintentar con un desafío nuevo', async provider => {
  authorize.mockResolvedValueOnce({ status: 'cancelled' });
  const label = provider === 'google' ? 'Continuar con Google' : 'Continuar con Facebook';
  const view = screen(); fireEvent.press(view.getByLabelText(label));
  await waitFor(() => expect(authorize).toHaveBeenCalledTimes(1));
  await act(async () => {});
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().token).toBeNull();
  expect(view.queryByRole('alert')).toBeNull();
  const retryNonce = 'b'.repeat(64);
  fetchMock.mockResolvedValueOnce(response(200, { data: { nonce: retryNonce, expires_at: '2030-01-01T00:00:00Z' } }));
  fetchMock.mockResolvedValueOnce(response(200, { data: { user: profile, token: 'retry-session' }, message: 'ok' }));
  authorize.mockResolvedValueOnce({ status: 'success', proof: provider === 'google'
    ? { provider, kind: 'google_id_token', value: 'retry-proof' }
    : { provider, kind: 'facebook_limited_token', value: 'retry-proof' } });
  fireEvent.press(view.getByLabelText(label));
  await waitFor(() => expect(useAuthStore.getState().token).toBe('retry-session'));
  expect(authorize).toHaveBeenLastCalledWith(provider, { nonce: retryNonce });
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ provider, nonce: retryNonce });
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('un resultado tardío de otro intento no reemplaza una cuenta ya cambiada', async () => {
  let complete: ((value: NativeOAuthResult) => void) | undefined;
  authorize.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const view = screen(); fireEvent.press(view.getByLabelText('Continuar con Google'));
  await waitFor(() => expect(authorize).toHaveBeenCalled());
  await act(async () => { await useAuthStore.getState().setSession('another-account'); });
  fetchMock.mockResolvedValueOnce(response(200, { data: { user: profile, token: 'old-account' }, message: 'ok' }));
  await act(async () => { complete?.({ status: 'success', proof: { provider: 'google', kind: 'google_id_token', value: 'old-proof' } }); });
  expect(useAuthStore.getState().token).toBe('another-account');
});

test('una prueba inválida al vincular conserva la sesión Lizto', async () => {
  await useAuthStore.getState().setSession('current-session');
  fetchMock.mockResolvedValueOnce(response(422, { code: 'oauth_invalid_proof', message: 'internal' }));
  const view = screen('link'); fireEvent.press(view.getByLabelText('Vincular Google'));
  expect(await view.findByText('No pudimos completar la autorización. Volvé a intentarlo.')).toBeTruthy();
  expect(useAuthStore.getState().token).toBe('current-session');
  expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/oauth\/link$/);
});

test('vincular cambia y deshabilita el botón, mantiene ese estado al remontar y oculta el aviso a los 30 segundos', async () => {
  await useAuthStore.getState().setSession('current-session');
  const linkedProfile = { ...profile, linked_oauth_providers: ['google'] };
  fetchMock.mockResolvedValueOnce(response(200, { data: { user: linkedProfile }, message: 'ok' }));
  fetchMock.mockResolvedValueOnce(response(200, { data: linkedProfile }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(ME_QUERY_KEY, { ...profile, linked_oauth_providers: [] });
  const element = <QueryClientProvider client={client}><OAuthButtons mode="link" lock={{ current: false }} /></QueryClientProvider>;
  jest.useFakeTimers();
  try {
    const view = render(element);
    fireEvent.press(view.getByLabelText('Vincular Google'));
    await act(async () => {});
    expect(view.getByLabelText('Google vinculado').props.accessibilityState.disabled).toBe(true);
    expect(view.getByText('Cuenta vinculada. Ya podés usarla para ingresar a Lizto.')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Google vinculado'));
    expect(authorize).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(29_999));
    expect(view.getByText('Cuenta vinculada. Ya podés usarla para ingresar a Lizto.')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1));
    expect(view.queryByText('Cuenta vinculada. Ya podés usarla para ingresar a Lizto.')).toBeNull();
    expect(view.getByLabelText('Google vinculado')).toBeTruthy();
    view.unmount();
    const reopened = render(element);
    expect(reopened.getByLabelText('Google vinculado').props.accessibilityState.disabled).toBe(true);
    expect(reopened.getByLabelText('Vincular Facebook').props.accessibilityState.disabled).toBe(false);
    reopened.unmount();
  } finally { jest.useRealTimers(); client.clear(); }
});

test('una apertura nueva obtiene de API el estado vinculado de Facebook y no ofrece volver a vincularlo', async () => {
  await useAuthStore.getState().setSession('current-session');
  fetchMock.mockReset();
  fetchMock.mockResolvedValueOnce(response(200, { data: { ...profile, linked_oauth_providers: ['facebook'] } }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><OAuthButtons mode="link" lock={{ current: false }} /></QueryClientProvider>);
  const button = await view.findByLabelText('Facebook vinculado');
  expect(button.props.accessibilityState.disabled).toBe(true);
  fireEvent.press(button);
  expect(authorize).not.toHaveBeenCalled();
  expect(view.queryByText('Cuenta vinculada. Ya podés usarla para ingresar a Lizto.')).toBeNull();
  view.unmount(); client.clear();
});
