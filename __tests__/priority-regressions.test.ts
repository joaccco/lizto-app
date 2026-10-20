import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { httpClient, ApiContractError, subscribeOnUnauthorized } from '@/core/api/httpClient';
import { saveToken, getToken, removeToken } from '@/core/security/secureStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { parseMoneyInput, parseDecimalToMoney } from '@/core/domain/money';
import { argentinaLocalToInstant, isInstantWithinWindow, ensureExplicitTimezoneISO } from '@/core/domain/time';
import { workRequestDetailSchema } from '@/features/work-requests/schemas/workRequestDetailSchema';
import { workRequestItemSchema } from '@/features/work-requests/schemas/workRequestSchema';
import { offersApi } from '@/features/offers/api/offersApi';
import { chatApi } from '@/features/chat/api/chatApi';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
const offerId = '550e8400-e29b-41d4-a716-446655440001';
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;
function respond(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);
}
const detail = { id: uuid, uuid, raw_prompt: 'Arreglo', status: 'pending_matching', urgency: 'scheduled', created_at: '2026-10-07T13:00:00Z' };

beforeEach(async () => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  global.fetch = mockFetch;
  useAuthStore.setState({ token: null, storageError: null });
  await removeToken();
});
afterAll(() => { global.fetch = originalFetch; });

// Regresiones reales: restaurar el fallback de memoria o silenciar delete hace fallar estos casos.
test('Un fallo de Secure Store impide declarar una sesión guardada', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('disk unavailable'));
  await expect(useAuthStore.getState().setSession('secret')).rejects.toThrow('disk unavailable');
  expect(useAuthStore.getState().token).toBeNull();
  expect(await getToken()).toBeNull();
});
test('Un logout fallido bloquea la sesión y solo se declara exitoso tras borrar y releer', async () => {
  await useAuthStore.getState().setSession('secret');
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('delete failed'));
  await expect(useAuthStore.getState().logout()).rejects.toThrow('delete failed');
  expect(useAuthStore.getState().storageError).toBe('delete');
  expect(await getToken()).toBe('secret');
  await useAuthStore.getState().logout();
  expect(await getToken()).toBeNull();
  expect(useAuthStore.getState().token).toBeNull();
  expect(useAuthStore.getState().storageError).toBeNull();
});
test('Detecta borrado que informa éxito pero conserva la credencial', async () => {
  await saveToken('secret');
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValueOnce(undefined);
  await expect(removeToken()).rejects.toThrow('SECURE_STORE_DELETE_FAILED');
});
test('El 401 notifica al layout incluso si falla el borrado seguro', async () => {
  respond({}, 401);
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('locked'));
  const notified = jest.fn();
  const unsubscribe = subscribeOnUnauthorized(notified);
  try {
    await expect(httpClient.get('/auth/me', z.unknown())).rejects.toThrow('locked');
    expect(notified).toHaveBeenCalledTimes(1);
  } finally { unsubscribe(); }
});
test('Un fallo de lectura inicial no produce una sesión anónima silenciosa', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('locked'));
  await useAuthStore.getState().initializeSession();
  expect(useAuthStore.getState().storageError).toBe('read');
  expect(useAuthStore.getState().isInitialized).toBe(true);
});

test.each(['pending_matching', 'pending_confirmation', 'active', 'cancelled', 'unknown'])('Redacta domicilio y coordenadas antes de confirmación: %s', status => {
  const parsed = workRequestDetailSchema.parse({ ...detail, status, location_address: 'Av. Privada 123', location_lat: -34.6, location_lng: -58.4, is_approximate: false });
  expect(parsed.location_address).toBeNull();
  expect(parsed.location_lat).toBeNull();
  expect(parsed.location_lng).toBeNull();
  expect(parsed.privacy_violation).toBe(true);
});
test('Sin marca de privacidad no confía en domicilio, ni siquiera con estado confirmado', () => {
  expect(workRequestDetailSchema.parse({ ...detail, status: 'confirmed', address: 'Privado' }).address).toBeNull();
});
test('Conserva zona aproximada y descarta coordenadas antes de llegar a UI', () => {
  const parsed = workRequestDetailSchema.parse({ ...detail, location_address: 'Palermo', location_lat: -34.58, location_lng: -58.43, is_approximate: true, location_radius_meters: 750 });
  expect(parsed.location_address).toBe('Palermo');
  expect(parsed.location_radius_meters).toBe(750);
  expect(parsed.location_lat).toBeNull();
  expect(parsed.privacy_violation).toBe(false);
});
test('Conserva ubicación exacta confirmada y protegida también en bandeja', () => {
  const parsed = workRequestItemSchema.parse({ ...detail, status: 'confirmed', category: null, category_slug: null, client_name: 'Ana', location_address: 'Av. 123', location_lat: -34.6, location_lng: -58.4, is_approximate: false, estimated_duration_min: null });
  expect(parsed.location_address).toBe('Av. 123');
  expect(parsed.location_lat).toBe(-34.6);
  expect(parsed.estimated_duration_min).toBeNull();
});

test('Hora argentina se convierte a un instante absoluto y la ventana respeta offsets y día', () => {
  expect(argentinaLocalToInstant('2026-10-07', '10:00')).toBe('2026-10-07T13:00:00.000Z');
  expect(isInstantWithinWindow('2026-10-07T13:00:00Z', '2026-10-07', '09:00', '11:00')).toBe(true);
  expect(isInstantWithinWindow('2026-10-07T10:00:00Z', '2026-10-07', '09:00', '11:00')).toBe(false);
  expect(isInstantWithinWindow('2026-10-08T13:00:00Z', '2026-10-07', '09:00', '11:00')).toBe(false);
  expect(isInstantWithinWindow('2026-10-07T10:00:00-03:00', '2026-10-07', '09:00', '11:00')).toBe(true);
});
test.each(['', 'invalidZ', '2026-10-07T10:00:00'])('Rechaza instante inválido en vez de inventar fecha: %s', value => {
  expect(() => ensureExplicitTimezoneISO(value)).toThrow('TIME_ERROR');
});
test.each([['2026-02-30', '10:00'], ['2026-10-07', '25:00'], ['', '10:00']])('Rechaza fecha/hora inválida: %s %s', (date, time) => {
  expect(() => argentinaLocalToInstant(date, time)).toThrow();
});
test('Parser es-AR conserva centavos y separadores de miles', () => {
  expect(parseMoneyInput('18.000,50')).toBe(1800050);
  expect(parseMoneyInput('18000,5')).toBe(1800050);
  expect(parseDecimalToMoney('18000.50').amountInCents).toBe(1800050);
});
test.each(['18000x', '18,000.50', '18.00', '-1', '', '1,234'])('No acepta prefijos numéricos o formato ambiguo: %s', value => {
  expect(() => parseMoneyInput(value)).toThrow('MONEY_ERROR');
});
test('No normaliza un precio corrupto a cero', () => {
  expect(() => parseDecimalToMoney('bad')).toThrow('MONEY_ERROR');
});

test('Oferta usa URL única, Bearer, decimal solo en transporte y respuesta en centavos', async () => {
  await saveToken('token');
  respond({ data: { id: offerId, status: 'pending', pricing_mode: 'quoted', proposed_price: '18000.50', price_min: null, price_max: null, notes: null, currency_code: 'ARS', round_number: 1 }, message: 'ok' }, 201);
  const result = await offersApi.store(uuid, { pricing_mode: 'quoted', proposed_price: 1800050, currency_code: 'ARS' });
  expect(mockFetch).toHaveBeenCalledWith(`http://localhost:8000/api/v1/service-requests/${uuid}/offers`, expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }), body: JSON.stringify({ pricing_mode: 'quoted', proposed_price: '18000.50', currency_code: 'ARS' }) }));
  expect(result.data.proposed_price).toBe(1800050);
});
test('Rango de visita ya es centavos: no se multiplica ni divide otra vez', async () => {
  respond({ data: { id: offerId, status: 'pending', pricing_mode: 'requires_visit', proposed_price: null, price_min: 1200050, price_max: 2500075, notes: null, currency_code: 'ARS', round_number: 1 }, message: 'ok' }, 201);
  const result = await offersApi.store(uuid, { pricing_mode: 'requires_visit', price_min: 1200050, price_max: 2500075, currency_code: 'ARS' });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({ pricing_mode: 'requires_visit', price_min: 1200050, price_max: 2500075, currency_code: 'ARS' });
  expect(result.data.price_max).toBe(2500075);
});
test('Payload inválido falla antes de llamar al servidor', async () => {
  await expect(offersApi.store(uuid, { pricing_mode: 'quoted', proposed_price: 12.50, currency_code: 'ARS' })).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
});
test('Respuesta monetaria corrupta produce error identificable en el borde', async () => {
  respond({ data: { id: offerId, status: 'pending', pricing_mode: 'quoted', proposed_price: 'bad', price_min: null, price_max: null, notes: null, currency_code: 'ARS', round_number: 1 }, message: 'ok' });
  await expect(offersApi.store(uuid, { pricing_mode: 'quoted', proposed_price: 100, currency_code: 'ARS' })).rejects.toBeInstanceOf(ApiContractError);
});
test('No permite volver a introducir el prefijo de versión en un endpoint', async () => {
  await expect(httpClient.get('/v1/requests', z.unknown())).rejects.toThrow('CONFIG_ERROR');
  expect(mockFetch).not.toHaveBeenCalled();
});
test('Chat acepta respuesta real de envío sin sender_name ni IDs numéricos en la app', async () => {
  respond({ data: { id: offerId, conversation_id: uuid, sender_id: 42, content: 'Hola', created_at: '2026-10-07T13:00:00Z', is_me: true }, message: 'ok' }, 201);
  const result = await chatApi.sendMessage(uuid, { content: 'Hola' });
  expect(mockFetch.mock.calls[0][0]).toBe(`http://localhost:8000/api/v1/conversations/${uuid}/messages`);
  expect(result.data).not.toHaveProperty('sender_id');
});

test('un 401 tardío de otra sesión no borra la cuenta nueva', async () => {
  await saveToken('old-account');
  let finish: ((response: Response) => void) | undefined;
  mockFetch.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }));
  const pending = httpClient.get('/auth/me', z.unknown());
  while (!finish) await Promise.resolve();
  await saveToken('new-account');
  finish({ ok: false, status: 401, json: async () => ({}) } as Response);
  await expect(pending).rejects.toMatchObject({ status: 401 });
  expect(await getToken()).toBe('new-account');
});
