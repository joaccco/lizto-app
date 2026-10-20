import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchema';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import '@/core/i18n';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
import LoginScreen from '../app/(auth)/login';

const registration = { name: 'A', email: 'persona@example.com', password: 'Abcdefg1', password_confirmation: 'Abcdefg1' };
const mockFetch = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => { mockFetch.mockReset(); global.fetch = mockFetch; useAuthStore.setState({ token: null, storageError: null }); });
afterEach(() => { global.fetch = originalFetch; });

function screen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><LoginScreen /></QueryClientProvider>);
}
function enter(view: ReturnType<typeof screen>) {
  fireEvent.changeText(view.getByLabelText('Correo electrónico'), 'persona@example.com');
  // A credential created before the registration policy must reach the server.
  fireEvent.changeText(view.getByLabelText('Contraseña'), 'abc');
}
function respond(status: number, body: unknown) {
  mockFetch.mockResolvedValueOnce({ ok: false, status, json: async () => body });
}

test('registro refleja nombre requerido y máximos de API, contando caracteres Unicode', () => {
  expect(registerSchema.safeParse(registration).success).toBe(true);
  expect(registerSchema.safeParse({ ...registration, name: ' '.repeat(3) }).success).toBe(false);
  expect(registerSchema.safeParse({ ...registration, name: 'á'.repeat(255), phone: '1'.repeat(50) }).success).toBe(true);
  expect(registerSchema.safeParse({ ...registration, name: 'á'.repeat(256) }).success).toBe(false);
  expect(registerSchema.safeParse({ ...registration, phone: '1'.repeat(51) }).success).toBe(false);
  expect(registerSchema.safeParse({ ...registration, name: '𐐀'.repeat(255), phone: null }).success).toBe(true);
  expect(loginSchema.parse({ email: ' persona@example.com ', password: ' abc ' })).toEqual({ email: 'persona@example.com', password: ' abc ' });
});

test('422 informa el error y conserva la contraseña y el correo para corregir y reintentar', async () => {
  respond(422, { message: 'Validation failed', errors: { email: ['Las credenciales no son correctas.'] } });
  const view = screen(); enter(view);
  fireEvent.press(view.getByText('Ingresar'));
  await waitFor(() => expect(view.getAllByText('Las credenciales no son correctas.').length).toBeGreaterThan(0));
  expect(view.getByLabelText('Correo electrónico').props.value).toBe('persona@example.com');
  expect(view.getByLabelText('Contraseña').props.value).toBe('abc');
  expect(useAuthStore.getState().token).toBeNull();
  expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ email: 'persona@example.com', password: 'abc' });
});

test.each([
  [403, 'Tu cuenta no tiene acceso en este momento. Contactá a soporte.'],
  [429, 'Hubo demasiados intentos. Esperá unos minutos antes de volver a ingresar.'],
  [503, 'No pudimos completar el ingreso. Intentá nuevamente en unos minutos.'],
])('login distingue HTTP %s sin mostrar mensajes de servidor sin validar', async (status, message) => {
  respond(status, { message: 'internal message' });
  const view = screen(); enter(view);
  fireEvent.press(view.getByText('Ingresar'));
  expect(await view.findByText(message)).toBeTruthy();
  expect(view.queryByText('internal message')).toBeNull();
});

test('un cuerpo 422 inválido no rompe el formulario y permite reintentar', async () => {
  respond(422, { errors: { email: 42 } });
  respond(503, {});
  const view = screen(); enter(view);
  fireEvent.press(view.getByText('Ingresar'));
  expect(await view.findByText('Las credenciales no son correctas.')).toBeTruthy();
  fireEvent.press(view.getByText('Ingresar'));
  expect(await view.findByText('No pudimos completar el ingreso. Intentá nuevamente en unos minutos.')).toBeTruthy();
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('dos envíos consecutivos no crean peticiones duplicadas', async () => {
  let finish: ((response: unknown) => void) | undefined;
  mockFetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = screen(); enter(view);
  const button = view.getByText('Ingresar');
  fireEvent.press(button); fireEvent.press(button);
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  await act(async () => { finish?.({ ok: false, status: 503, json: async () => ({}) }); });
  expect(await view.findByText('No pudimos completar el ingreso. Intentá nuevamente en unos minutos.')).toBeTruthy();
});
