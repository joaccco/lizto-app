import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';
import { AccessToken, AuthenticationToken, LoginManager } from 'react-native-fbsdk-next';
import { authorizeNativeOAuth } from '@/features/auth/oauth/nativeOAuth';

jest.mock('react-native-nitro-google-signin', () => ({
  GoogleOneTapSignIn: { configure: jest.fn(), checkPlayServices: jest.fn(), presentExplicitSignIn: jest.fn(), signOut: jest.fn() },
  isErrorWithCode: (error: unknown) => typeof error === 'object' && error !== null && 'code' in error,
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));
jest.mock('react-native-fbsdk-next', () => ({
  Settings: { initializeSDK: jest.fn() },
  LoginManager: { logInWithPermissions: jest.fn(), logOut: jest.fn() },
  AuthenticationToken: { getAuthenticationTokenIOS: jest.fn() },
  AccessToken: { getCurrentAccessToken: jest.fn() },
}));
const google = jest.mocked(GoogleOneTapSignIn);
const login = jest.mocked(LoginManager);
const authentication = jest.mocked(AuthenticationToken);
const access = jest.mocked(AccessToken);
const challenge = { nonce: 'b'.repeat(64) };
const originalOS = Platform.OS;

beforeEach(() => {
  jest.resetAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  if (!Constants.expoConfig) throw new Error('Expo test config missing');
  Constants.expoConfig.extra = { oauth: {
    google: { iosClientId: '123-ios.apps.googleusercontent.com', webClientId: '123-web.apps.googleusercontent.com' },
    facebook: { appId: '123' },
  } };
  google.signOut.mockResolvedValue();
  login.logInWithPermissions.mockResolvedValue({ isCancelled: false });
});
afterEach(() => { Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS }); });

test('Google entrega al SDK el desafío de API y extrae el ID token del resultado', async () => {
  google.presentExplicitSignIn.mockResolvedValue({ type: 'success', data: {
    idToken: 'google-signed-proof', scopes: [], serverAuthCode: null,
    user: { id: 'google-user', name: 'Prueba', email: 'qa@example.test', photo: null, familyName: null, givenName: null },
  } });
  const result = await authorizeNativeOAuth('google', challenge);
  expect(google.configure).toHaveBeenCalledWith(expect.objectContaining({ nonce: challenge.nonce, offlineAccess: false }));
  expect(result).toMatchObject({ status: 'success', proof: { provider: 'google', kind: 'google_id_token', value: 'google-signed-proof' } });
  expect(google.signOut).toHaveBeenCalled();
});

test('Facebook Android obtiene access token sin consultar AuthenticationToken de iOS', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  access.getCurrentAccessToken.mockResolvedValue({ accessToken: 'facebook-android-proof' } as Awaited<ReturnType<typeof AccessToken.getCurrentAccessToken>>);
  const result = await authorizeNativeOAuth('facebook', challenge);
  expect(result).toMatchObject({ status: 'success', proof: { provider: 'facebook', kind: 'facebook_access_token', value: 'facebook-android-proof' } });
  expect(authentication.getAuthenticationTokenIOS).not.toHaveBeenCalled();
  expect(login.logOut).toHaveBeenCalled();
});

test('Facebook iOS usa Limited Login y nunca interpreta su JWT como access token', async () => {
  authentication.getAuthenticationTokenIOS.mockResolvedValue({ authenticationToken: 'test-limited-proof', nonce: challenge.nonce, graphDomain: 'facebook' });
  const result = await authorizeNativeOAuth('facebook', challenge);
  expect(result).toMatchObject({ status: 'success', proof: { kind: 'facebook_limited_token' } });
  expect(login.logInWithPermissions).toHaveBeenCalledWith(['public_profile', 'email'], 'limited', challenge.nonce);
  expect(access.getCurrentAccessToken).not.toHaveBeenCalled();
  expect(login.logOut).toHaveBeenCalledTimes(1);
});

test('Facebook cancelado no recupera credenciales guardadas de otro intento', async () => {
  login.logInWithPermissions.mockResolvedValue({ isCancelled: true });
  expect(await authorizeNativeOAuth('facebook', challenge)).toEqual({ status: 'cancelled' });
  expect(authentication.getAuthenticationTokenIOS).not.toHaveBeenCalled();
  expect(access.getCurrentAccessToken).not.toHaveBeenCalled();
  expect(login.logOut).toHaveBeenCalled();
});

test('Facebook sin prueba no devuelve un ingreso exitoso y limpia el SDK', async () => {
  authentication.getAuthenticationTokenIOS.mockResolvedValue(null);
  await expect(authorizeNativeOAuth('facebook', challenge)).rejects.toMatchObject({ code: 'missing_proof' });
  expect(login.logOut).toHaveBeenCalled();
});

test('Google devuelve cancelación sin error de credenciales y limpia el SDK', async () => {
  google.presentExplicitSignIn.mockResolvedValue({ type: 'cancelled', data: null });
  expect(await authorizeNativeOAuth('google', challenge)).toEqual({ status: 'cancelled' });
  expect(google.signOut).toHaveBeenCalled();
});

test('Google también normaliza cancelación lanzada por el SDK', async () => {
  google.presentExplicitSignIn.mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });
  expect(await authorizeNativeOAuth('google', challenge)).toEqual({ status: 'cancelled' });
  expect(google.signOut).toHaveBeenCalled();
});

test('un error real de Google no se disfraza de cancelación', async () => {
  google.presentExplicitSignIn.mockRejectedValue(new Error('network failed'));
  await expect(authorizeNativeOAuth('google', challenge)).rejects.toThrow('network failed');
  expect(google.signOut).toHaveBeenCalled();
});

test('sin configuración Google no abre el SDK', async () => {
  if (!Constants.expoConfig) throw new Error('Expo test config missing');
  Constants.expoConfig.extra = {};
  await expect(authorizeNativeOAuth('google', challenge)).rejects.toMatchObject({ code: 'configuration' });
  expect(google.configure).not.toHaveBeenCalled();
  expect(google.presentExplicitSignIn).not.toHaveBeenCalled();
});

test('web se rechaza antes de abrir cualquiera de los SDK nativos', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  await expect(authorizeNativeOAuth('google', challenge)).rejects.toMatchObject({ code: 'unsupported_platform' });
  expect(google.configure).not.toHaveBeenCalled();
  expect(login.logInWithPermissions).not.toHaveBeenCalled();
});

test('clientes de Google de proyectos diferentes fallan antes de abrir el selector', async () => {
  if (!Constants.expoConfig) throw new Error('Expo test config missing');
  Constants.expoConfig.extra = { oauth: { google: {
    iosClientId: '123-ios.apps.googleusercontent.com', webClientId: '456-web.apps.googleusercontent.com',
  } } };
  await expect(authorizeNativeOAuth('google', challenge)).rejects.toMatchObject({ code: 'configuration' });
  expect(google.configure).not.toHaveBeenCalled();
  expect(google.presentExplicitSignIn).not.toHaveBeenCalled();
});
