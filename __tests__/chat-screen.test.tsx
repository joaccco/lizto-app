import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatScreen from '../app/chat/[id]';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import '@/core/i18n';

jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '550e8400-e29b-41d4-a716-446655440000' }), useRouter: () => ({ back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const conversation = {
  conversation_id: '550e8400-e29b-41d4-a716-446655440000', client_id: 42, client_name: 'Ana', provider_id: 7, provider_name: 'Carlos', provider_rating: null,
  category_name: 'Plomería', raw_prompt: 'Reparación', work_status: 'pending_confirmation', is_closed: false, messages: [],
};
function response(body: unknown, status = 200): Response { return { ok: status < 400, status, json: async () => body } as Response; }
beforeEach(() => { useAuthStore.setState({ activeRole: 'client' }); mockFetch.mockReset(); global.fetch = mockFetch; });
afterAll(() => { global.fetch = originalFetch; });

// Restaurar el borrado del input en el catch haría fallar este caso: usa pantalla, hook y HTTP reales.
test('Un rechazo 422 conserva el mensaje editable y permite reintentar', async () => {
  mockFetch.mockImplementation(async (_url, options) => options?.method === 'POST'
    ? response({ message: 'No se permite compartir datos de contacto.' }, 422)
    : response({ data: conversation }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  const view = render(<QueryClientProvider client={client}><ChatScreen /></QueryClientProvider>);
  await view.findByTestId('chat-input');
  const text = 'Mi WhatsApp es 11 1234 5678';
  fireEvent.changeText(view.getByTestId('chat-input'), text);
  fireEvent.press(view.getByTestId('chat-send-button'));
  await view.findByTestId('anti-contact-error-banner');
  expect(view.getByTestId('chat-input').props.value).toBe(text);
  fireEvent.changeText(view.getByTestId('chat-input'), 'Confirmo el horario');
  await waitFor(() => expect(view.queryByTestId('anti-contact-error-banner')).toBeNull());
  expect(view.getByTestId('chat-send-button').props.accessibilityState?.disabled ?? view.getByTestId('chat-send-button').props.disabled).not.toBe(true);
  view.unmount(); client.clear();
});
