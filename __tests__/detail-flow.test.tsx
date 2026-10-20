import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DetailScreen from '../app/(pro)/requests/[id]';
import '@/core/i18n';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
const offerId = '550e8400-e29b-41d4-a716-446655440001';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: '550e8400-e29b-41d4-a716-446655440000' }), useRouter: () => ({ back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
afterAll(() => { global.fetch = originalFetch; });

// Una regresión que entregue el domicilio crudo a la pantalla, permita descartar o use ID de solicitud falla aquí.
test('Detalle oculta domicilio pendiente y pregunta solo sobre la oferta devuelta por API', async () => {
  global.fetch = mockFetch;
  mockFetch.mockImplementation(async (url, options) => {
    const body = options?.method !== 'POST'
      ? { data: { id: uuid, uuid, raw_prompt: 'Reparar cocina', status: 'pending_matching', urgency: 'scheduled', location_address: 'Av. Privada 123', is_approximate: false, created_at: '2026-10-07T13:00:00Z' } }
      : String(url).endsWith('/questions')
        ? { data: { id: 42, question_text: '¿Hay escalera?' }, message: 'ok' }
        : { data: { id: offerId, status: 'pending', pricing_mode: 'quoted', proposed_price: '18000.00', price_min: null, price_max: null, notes: null, currency_code: 'ARS', round_number: 1 }, message: 'ok' };
    return { ok: true, status: 200, json: async () => body } as Response;
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  const view = render(<QueryClientProvider client={client}><DetailScreen /></QueryClientProvider>);
  await view.findByTestId('work-request-detail-screen');
  expect(view.queryByText('Av. Privada 123')).toBeNull();
  expect(view.getByText('Ubicación no disponible')).toBeTruthy();
  expect(view.getByText('Detalle de solicitud')).toBeTruthy();
  expect(view.getByTestId('decline-request-button')).toBeDisabled();
  expect(view.getByTestId('open-question-sheet-button')).toBeDisabled();
  fireEvent.press(view.getByTestId('open-offer-sheet-button'));
  fireEvent.changeText(view.getByTestId('offer-price-input'), '18000');
  fireEvent.press(view.getByTestId('send-offer-submit-button'));
  await waitFor(() => expect(view.getByTestId('open-question-sheet-button')).toBeEnabled());
  fireEvent.press(view.getByTestId('open-question-sheet-button'));
  fireEvent.changeText(view.getByTestId('question-input'), '¿Hay escalera?');
  fireEvent.press(view.getByTestId('send-question-button'));
  await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(`http://localhost:8000/api/v1/offers/${offerId}/questions`, expect.objectContaining({ method: 'POST' })));
  expect(mockFetch.mock.calls.some(([url]) => String(url).endsWith('/decline'))).toBe(false);
  view.unmount(); client.clear();
});
