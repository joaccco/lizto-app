import { sessionRedirect } from '@/core/navigation/sessionRoute';
test('Visitantes pueden explorar y deben ingresar para abrir trabajo profesional o chat', () => {
  expect(sessionRedirect({ token: null, role: null, group: '(cliente)' })).toBeNull();
  expect(sessionRedirect({ token: null, role: null, group: '(pro)' })).toBe('/(auth)/login');
  expect(sessionRedirect({ token: null, role: null, group: 'chat' })).toBe('/(auth)/login');
});
test('Cambiar de rol cambia de grupo sin interrumpir conversaciones compartidas', () => {
  expect(sessionRedirect({ token: 'test', role: 'client', group: '(pro)' })).toBe('/(cliente)');
  expect(sessionRedirect({ token: 'test', role: 'provider', group: '(cliente)' })).toBe('/(pro)');
  expect(sessionRedirect({ token: 'test', role: 'client', group: 'chat' })).toBeNull();
});
test('No adivina el rol mientras el perfil no se haya recuperado', () => {
  expect(sessionRedirect({ token: 'test', role: null, group: '(auth)' })).toBeNull();
});
