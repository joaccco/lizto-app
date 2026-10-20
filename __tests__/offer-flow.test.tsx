import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferSheet } from '@/features/offers/components/OfferSheet';
import { useCreateOffer, useAskQuestion, useDeclineWorkRequest } from '@/features/offers/api/useOffers';
import { WORK_REQUESTS_QUERY_KEY } from '@/features/work-requests/api/useWorkRequests';
import { workRequestDetailKey } from '@/features/work-requests/api/useWorkRequestDetail';
import { CreateOfferFormData } from '@/features/offers/schemas/offerSchema';
import '@/core/i18n';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const uuid = '550e8400-e29b-41d4-a716-446655440000';
const offerId = '550e8400-e29b-41d4-a716-446655440001';
const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
function respond(body: unknown) { mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => body } as Response); }
beforeEach(() => { mockFetch.mockReset(); global.fetch = mockFetch; });
afterAll(() => { global.fetch = originalFetch; });

// Fallaría si el modal enviara pesos, anexara Z a la hora local o inventara duración.
test('El formulario envía centavos y UTC, sin duración inventada', async () => {
  const submit = jest.fn<Promise<void>, [CreateOfferFormData]>().mockResolvedValue(undefined);
  const view = render(<OfferSheet visible onClose={() => {}} onSubmit={submit} scheduledDate="2026-10-07" windowStart="09:00" windowEnd="11:00" />);
  fireEvent.changeText(view.getByTestId('offer-price-input'), '18.000,50');
  fireEvent.changeText(view.getByTestId('offer-time-input'), '10:00');
  fireEvent.press(view.getByTestId('send-offer-submit-button'));
  await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ proposed_price: 1800050, proposed_start_at: '2026-10-07T13:00:00.000Z', currency_code: 'ARS' })));
  expect(submit.mock.calls[0][0].estimated_duration_min).toBeUndefined();
});
test('El formulario no envía hora fuera de ventana ni fecha ausente', async () => {
  const submit = jest.fn<Promise<void>, [CreateOfferFormData]>();
  const view = render(<OfferSheet visible onClose={() => {}} onSubmit={submit} scheduledDate="2026-10-07" windowStart="09:00" windowEnd="11:00" />);
  fireEvent.changeText(view.getByTestId('offer-price-input'), '18000');
  fireEvent.changeText(view.getByTestId('offer-time-input'), '12:00');
  fireEvent.press(view.getByTestId('send-offer-submit-button'));
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  expect(submit).not.toHaveBeenCalled();
  fireEvent.changeText(view.getByTestId('offer-time-input'), '10:00');
  fireEvent.changeText(view.getByTestId('offer-date-input'), '');
  fireEvent.press(view.getByTestId('send-offer-submit-button'));
  expect(submit).not.toHaveBeenCalled();
});

// Usa las mutaciones y el cliente HTTP reales; solo se reemplaza el transporte fetch.
test('Ofertar y descartar invalidan la bandeja correcta; preguntar exige ID de oferta', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const view = renderHook(() => ({ create: useCreateOffer(uuid), question: useAskQuestion(offerId, uuid), unavailable: useAskQuestion(null, uuid), decline: useDeclineWorkRequest(uuid) }), { wrapper });
  client.setQueryData(WORK_REQUESTS_QUERY_KEY, []);
  client.setQueryData(workRequestDetailKey(uuid), { uuid });
  respond({ data: { id: offerId, status: 'pending', pricing_mode: 'quoted', proposed_price: '18000.50', price_min: null, price_max: null, notes: null, currency_code: 'ARS', round_number: 1 }, message: 'ok' });
  await act(async () => { await view.result.current.create.mutateAsync({ pricing_mode: 'quoted', proposed_price: 1800050, currency_code: 'ARS' }); });
  expect(client.getQueryState(WORK_REQUESTS_QUERY_KEY)?.isInvalidated).toBe(true);
  expect(client.getQueryState(workRequestDetailKey(uuid))?.isInvalidated).toBe(true);
  respond({ data: { id: 42, question_text: '¿Hay escalera?' }, message: 'ok' });
  await act(async () => { await view.result.current.question.mutateAsync({ question_text: '¿Hay escalera?' }); });
  expect(mockFetch.mock.calls[1][0]).toBe(`http://localhost:8000/api/v1/offers/${offerId}/questions`);
  const count = mockFetch.mock.calls.length;
  await act(async () => { await expect(view.result.current.unavailable.mutateAsync({ question_text: 'Hola' })).rejects.toThrow('OFFER_REQUIRED'); });
  expect(mockFetch).toHaveBeenCalledTimes(count);
  client.setQueryData(WORK_REQUESTS_QUERY_KEY, []);
  respond({ data: { id: uuid, status: 'declined' }, message: 'ok' });
  await act(async () => { await view.result.current.decline.mutateAsync(); });
  expect(client.getQueryState(WORK_REQUESTS_QUERY_KEY)?.isInvalidated).toBe(true);
  view.unmount(); client.clear();
});
