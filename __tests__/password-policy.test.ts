import { loginSchema, registerSchema } from '@/features/auth/schemas/authSchema';

function registration(password: string, confirmation = password) {
  return registerSchema.safeParse({ name: 'Persona', email: 'persona@example.com', password, password_confirmation: confirmation });
}

test.each(['Abcdefg1', 'ABCDEFG1', 'Abcdefgh1', 'Password123'])('registro acepta %s sin exigir minúscula ni símbolo', password => {
  expect(registration(password).success).toBe(true);
});

test.each([
  ['Abcdef1', 'validation.passwordRegister'],
  ['abcdefg1', 'validation.passwordUppercase'],
  ['Abcdefgh', 'validation.passwordNumber'],
])('registro rechaza %s con un mensaje identificable', (password, message) => {
  const result = registration(password);
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['password'], message })]));
});

test('la confirmación debe coincidir', () => {
  const result = registration('Abcdefg1', 'Abcdefg2');
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['password_confirmation'], message: 'validation.passwordMismatch' })]));
});

test('login acepta credenciales anteriores sin imponer la política de registro', () => {
  expect(loginSchema.safeParse({ email: 'persona@example.com', password: 'abc' }).success).toBe(true);
  expect(loginSchema.safeParse({ email: 'persona@example.com', password: '' }).success).toBe(false);
});
