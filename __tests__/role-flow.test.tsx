import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { saveToken, removeToken, getActiveRole } from '@/core/security/secureStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

const mockReplace = jest.fn();
const mockSegments = ['(cliente)'];
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn().mockResolvedValue(true), hideAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }), useSegments: () => mockSegments,
  Stack: Object.assign(({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="role-routes">{children}</View>;
  }, { Protected: ({ guard, children }: { guard: boolean; children: React.ReactNode }) => guard ? children : null, Screen: () => null }),
}));
import RootLayout from '../app/_layout';
const mockFetch = jest.fn();
const originalFetch = global.fetch;
const user = { id: '550e8400-e29b-41d4-a716-446655440099', name: 'Persona', email: 'persona@example.com', status: 'active', roles: ['client', 'provider'], has_provider_profile: true };
beforeEach(async () => {
  jest.clearAllMocks();
  mockSegments[0] = '(cliente)';
  global.fetch = mockFetch;
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: user }) });
  await SecureStore.deleteItemAsync(`lizto_active_role.${user.id}`);
  await saveToken('role-session');
  useAuthStore.setState({ token: 'role-session', activeRole: null, isInitialized: true, storageError: null });
});
afterEach(async () => { global.fetch = originalFetch; await removeToken(); });

test('elige vista, cambia rápido y recupera la elección al reabrir sin consultar de nuevo al cambiar', async () => {
  const view = render(<RootLayout />);
  fireEvent.press(await view.findByText('Contratar un servicio'));
  fireEvent.press(await view.findByText('Cambiar a modo profesional'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(pro)'));
  expect(await getActiveRole(user.id)).toBe('provider');
  expect(mockFetch).toHaveBeenCalledTimes(1);
  view.unmount();
  mockSegments[0] = '(pro)';
  const reopened = render(<RootLayout />);
  expect(await reopened.findByText('Cambiar a modo cliente')).toBeTruthy();
  expect(reopened.queryByText('Contratar un servicio')).toBeNull();
});

test('si falla guardar la vista, conserva la selección y permite reintentar', async () => {
  const view = render(<RootLayout />);
  const choice = await view.findByText('Trabajar como profesional');
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage locked'));
  fireEvent.press(choice);
  expect(await view.findByText('No pudimos completar la acción. Intentá nuevamente.')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('Contratar un servicio'));
  expect(await view.findByText('Cambiar a modo profesional')).toBeTruthy();
});

test('una cuenta sin roles móviles no accede a las rutas privadas', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { ...user, roles: ['admin'] } }) });
  const view = render(<RootLayout />);
  expect(await view.findByText('Tu cuenta no tiene un rol habilitado para usar esta app.')).toBeTruthy();
  expect(view.queryByTestId('role-routes')).toBeNull();
});


test('cambiar de cuenta descarta perfil y vista de la sesión anterior', async () => {
  const view = render(<RootLayout />);
  fireEvent.press(await view.findByText('Trabajar como profesional'));
  expect(await view.findByText('Cambiar a modo cliente')).toBeTruthy();
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { ...user, id: '550e8400-e29b-41d4-a716-446655440098', name: 'Otra cuenta' } }) });
  await act(async () => { await useAuthStore.getState().setSession('another-session'); });
  expect(await view.findByText('Contratar un servicio')).toBeTruthy();
  expect(view.queryByText('Cambiar a modo cliente')).toBeNull();
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
