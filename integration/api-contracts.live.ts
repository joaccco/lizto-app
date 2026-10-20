import { request } from 'node:http';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { loginResponseSchema, meResponseSchema } from '@/features/auth/schemas/authSchema';
import { categoriesResponseSchema, providersResponseSchema } from '@/features/catalog/schemas/catalogSchema';
import { clientRequestsResponseSchema } from '@/features/client-requests/schemas/clientRequestSchema';

const base = process.env.LIZTO_LIVE_API_URL;
if (!base || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) {
  throw new Error('LIZTO_LIVE_API_URL must point to an isolated loopback API; these tests create test accounts.');
}
const email = `mobile-stage1-${randomUUID()}@example.test`;
const password = 'Abcdefg1';
let token: string;
let registrationBody: unknown;
function call(path: string, method = 'GET', body?: unknown, credential?: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = request(`${base}${path}`, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(credential ? { Authorization: `Bearer ${credential}` } : {}) },
    }, response => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { raw += chunk; });
      response.on('end', () => {
        try { resolve({ status: response.statusCode ?? 0, body: JSON.parse(raw) as unknown }); }
        catch { reject(new Error(`Non-JSON response from ${path} (${response.statusCode})`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('API timeout')));
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

beforeAll(async () => {
  const response = await call('/auth/register', 'POST', { name: 'Prueba móvil local', email, password, password_confirmation: password, phone: null });
  expect(response.status).toBe(201);
  registrationBody = response.body;
  token = z.object({ data: z.object({ token: z.string() }) }).parse(response.body).data.token;
});
afterAll(async () => { if (token) await call('/auth/logout', 'POST', undefined, token); });

test('registro devuelve el UUID persistido requerido por la app', () => {
  const session = loginResponseSchema.parse(registrationBody);
  expect(session.data.user.roles).toContain('client');
});

test('health confirma la base real', async () => {
  const response = await call('/health');
  expect(response.status).toBe(200);
  expect(z.object({ status: z.literal('ok') }).parse(response.body).status).toBe('ok');
});
test('catálogo público cumple los esquemas consumidos', async () => {
  const categories = await call('/categories');
  expect(categories.status).toBe(200);
  expect(categoriesResponseSchema.parse(categories.body).data.length).toBeGreaterThan(0);
  const providers = await call('/providers?page=1');
  expect(providers.status).toBe(200);
  providersResponseSchema.parse(providers.body);
});
test('login con ocho caracteres, perfil y solicitudes cumplen contratos móviles', async () => {
  const login = await call('/auth/login', 'POST', { email, password });
  expect(login.status).toBe(200);
  const logged = loginResponseSchema.parse(login.body);
  if (process.env.LIZTO_NATIVE_FIXTURE_PATH) {
    // Test credential only; the bearer token stays in memory.
    writeFileSync(process.env.LIZTO_NATIVE_FIXTURE_PATH, JSON.stringify({ email, password }), { mode: 0o600 });
  }
  const profile = await call('/auth/me', 'GET', undefined, logged.data.token);
  expect(profile.status).toBe(200);
  expect(meResponseSchema.parse(profile.body).data.email).toBe(email);
  const requests = await call('/requests?page=1', 'GET', undefined, logged.data.token);
  expect(requests.status).toBe(200);
  expect(clientRequestsResponseSchema.parse(requests.body).data).toHaveLength(0);
  expect((await call('/auth/logout', 'POST', undefined, logged.data.token)).status).toBe(200);
  expect((await call('/auth/me', 'GET', undefined, logged.data.token)).status).toBe(401);
});
test('contraseña corta devuelve 422 y una credencial errónea no autentica', async () => {
  const short = await call('/auth/register', 'POST', { name: 'Prueba', email: `short-${email}`, password: 'Abcdef1', password_confirmation: 'Abcdef1' });
  expect(short.status).toBe(422);
  expect(z.object({ errors: z.object({ password: z.array(z.string()).min(1) }) }).safeParse(short.body).success).toBe(true);
  const invalid = await call('/auth/login', 'POST', { email, password: 'incorrect' });
  expect(invalid.status).toBe(422);
  expect(z.object({ errors: z.object({ email: z.array(z.string()).min(1) }) }).safeParse(invalid.body).success).toBe(true);
});
