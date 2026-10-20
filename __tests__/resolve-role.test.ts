import { resolveRole } from '@/features/auth/domain/resolveRole';

test('un rol revocado no se recupera desde la preferencia local', () => {
  expect(resolveRole(['client'], 'provider')).toEqual({ status: 'resolved', role: 'client' });
  expect(resolveRole(['provider'], 'client')).toEqual({ status: 'resolved', role: 'provider' });
});

test('doble rol sin preferencia requiere decisión explícita, independientemente del orden', () => {
  expect(resolveRole(['client', 'provider'], null)).toEqual({ status: 'selection_required' });
  expect(resolveRole(['provider', 'client'], null)).toEqual({ status: 'selection_required' });
  expect(resolveRole(['provider', 'client'], 'client')).toEqual({ status: 'resolved', role: 'client' });
});

test('roles internos y perfiles sin rol móvil no reciben permisos client inventados', () => {
  expect(resolveRole(['admin', 'moderator'], 'client')).toEqual({ status: 'unsupported' });
  expect(resolveRole([], null)).toEqual({ status: 'unsupported' });
  expect(resolveRole(['admin', 'provider', 'provider'], null)).toEqual({ status: 'resolved', role: 'provider' });
});
