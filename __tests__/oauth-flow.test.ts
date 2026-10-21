import { createOAuthFlow, OAuthError } from '@/features/auth/oauth/oauthFlow';
import type { OAuthAuthorize, OAuthBackend, OAuthProof } from '@/features/auth/oauth/oauthFlow';

const nonce = 'a'.repeat(64);
const googleProof: OAuthProof = { provider: 'google', kind: 'google_id_token', value: 'test-google-proof' };
const session = {
  data: { token: 'lizto-test-token', user: {
    id: '0b29b2c0-28c2-44cf-bbdd-279fe0e7bc8b', name: 'Prueba', email: 'qa@example.test',
    status: 'active', roles: ['client'], has_provider_profile: false,
  } }, message: 'ok',
};
function setup() {
  const backend: jest.Mocked<OAuthBackend> = {
    begin: jest.fn().mockResolvedValue({ nonce }), exchange: jest.fn().mockResolvedValue(session),
  };
  const authorize = jest.fn<ReturnType<OAuthAuthorize>, Parameters<OAuthAuthorize>>()
    .mockResolvedValue({ status: 'success', proof: googleProof });
  return { backend, authorize, run: createOAuthFlow(backend, authorize) };
}

test('cancelar el proveedor no intercambia credenciales ni crea una sesión', async () => {
  const { run, backend, authorize } = setup();
  authorize.mockResolvedValue({ status: 'cancelled' });
  expect(await run('google')).toEqual({ status: 'cancelled' });
  expect(backend.exchange).not.toHaveBeenCalled();
});

test('una prueba nativa válida no autoriza si falla la API; permite reintentar luego', async () => {
  const { run, backend } = setup();
  backend.exchange.mockRejectedValueOnce(new Error('offline'));
  await expect(run('google')).rejects.toThrow('offline');
  await expect(run('google')).resolves.toMatchObject({ status: 'success' });
});

test('una respuesta sin UUID no se convierte en sesión pese al token devuelto', async () => {
  const { run, backend } = setup();
  backend.exchange.mockResolvedValue({ ...session, data: { ...session.data, user: { ...session.data.user, id: null } } });
  await expect(run('google')).rejects.toThrow();
});

test('una credencial de otro proveedor no se envía al intercambio', async () => {
  const { run, backend, authorize } = setup();
  authorize.mockResolvedValue({ status: 'success', proof: { provider: 'facebook', kind: 'facebook_limited_token', value: 'test-proof' } });
  await expect(run('google')).rejects.toBeInstanceOf(OAuthError);
  expect(backend.exchange).not.toHaveBeenCalled();
});

test.each([null, { nonce: '' }, { nonce: 'nonce con espacios' }])('un desafío inválido (%p) no abre el selector nativo', async challenge => {
  const { run, backend, authorize } = setup();
  backend.begin.mockResolvedValue(challenge);
  await expect(run('google')).rejects.toThrow();
  expect(authorize).not.toHaveBeenCalled();
  expect(backend.exchange).not.toHaveBeenCalled();
});

test('dos intentos simultáneos no abren dos selectores y el bloqueo se libera', async () => {
  const { run, backend, authorize } = setup();
  let release: ((value: { status: 'cancelled' }) => void) | undefined;
  authorize.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const first = run('google');
  await Promise.resolve();
  expect(await run('facebook')).toEqual({ status: 'busy' });
  expect(authorize).toHaveBeenCalledTimes(1);
  expect(backend.begin).toHaveBeenCalledTimes(1);
  release?.({ status: 'cancelled' });
  await first;
  await expect(run('google')).resolves.toMatchObject({ status: 'success' });
});

test('una sesión de API sin roles no se acepta para resolver navegación', async () => {
  const { run, backend } = setup();
  backend.exchange.mockResolvedValue({ ...session, data: { ...session.data, user: { ...session.data.user, roles: null } } });
  await expect(run('google')).rejects.toThrow();
});
