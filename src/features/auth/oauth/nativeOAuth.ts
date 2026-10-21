import { Platform } from 'react-native';
import { getGoogleOAuthConfig, requireFacebookOAuthConfig } from './oauthConfig';
import { OAuthError, oauthChallengeSchema, oauthProofSchema, oauthProviderSchema } from './oauthFlow';
import type { NativeOAuthResult, OAuthAuthorize } from './oauthFlow';

async function authorizeGoogle(nonce: string): Promise<NativeOAuthResult> {
  const config = getGoogleOAuthConfig();
  // Load native bindings only after checking platform/configuration, never during web startup.
  const { GoogleOneTapSignIn, isErrorWithCode, statusCodes }: typeof import('react-native-nitro-google-signin')
    = require('react-native-nitro-google-signin');
  GoogleOneTapSignIn.configure({ ...config, nonce, offlineAccess: false, autoSelectOnSignIn: false });
  try {
    if (Platform.OS === 'android') await GoogleOneTapSignIn.checkPlayServices();
    const result = await GoogleOneTapSignIn.presentExplicitSignIn();
    if (result.type === 'cancelled') return { status: 'cancelled' };
    if (result.type !== 'success' || !result.data?.idToken) throw new OAuthError('missing_proof');
    return { status: 'success', proof: oauthProofSchema.parse({
      provider: 'google', kind: 'google_id_token', value: result.data.idToken,
    }) };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return { status: 'cancelled' };
    throw error;
  } finally {
    // Keep the provider's proof ephemeral; only Lizto's token may persist via Secure Store.
    await GoogleOneTapSignIn.signOut();
  }
}

async function authorizeFacebook(nonce: string): Promise<NativeOAuthResult> {
  requireFacebookOAuthConfig();
  const { Settings, LoginManager, AuthenticationToken, AccessToken }: typeof import('react-native-fbsdk-next')
    = require('react-native-fbsdk-next');
  Settings.initializeSDK();
  try {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email'], 'limited', nonce);
    if (result.isCancelled) return { status: 'cancelled' };
    const kind = Platform.OS === 'ios' ? 'facebook_limited_token' : 'facebook_access_token';
    const value = Platform.OS === 'ios'
      ? (await AuthenticationToken.getAuthenticationTokenIOS())?.authenticationToken
      : (await AccessToken.getCurrentAccessToken())?.accessToken;
    if (!value) throw new OAuthError('missing_proof');
    return { status: 'success', proof: oauthProofSchema.parse({ provider: 'facebook', kind, value }) };
  } finally {
    LoginManager.logOut();
  }
}

export const authorizeNativeOAuth: OAuthAuthorize = async (provider, challenge) => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') throw new OAuthError('unsupported_platform');
  const { nonce } = oauthChallengeSchema.parse(challenge);
  const selected = oauthProviderSchema.parse(provider);
  return selected === 'google' ? authorizeGoogle(nonce) : authorizeFacebook(nonce);
};
