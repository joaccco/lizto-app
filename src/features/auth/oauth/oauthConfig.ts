import Constants from 'expo-constants';
import { z } from 'zod';
import { OAuthError } from './oauthFlow';
import { googleOAuthConfigSchema } from '@/config/oauthSchemas';

export function getGoogleOAuthConfig() {
  const parsed = z.object({ oauth: z.object({ google: googleOAuthConfigSchema }) })
    .safeParse(Constants.expoConfig?.extra);
  if (!parsed.success) throw new OAuthError('configuration');
  return parsed.data.oauth.google;
}
export function requireFacebookOAuthConfig() {
  const parsed = z.object({ oauth: z.object({ facebook: z.object({ appId: z.string().regex(/^\d+$/) }) }) })
    .safeParse(Constants.expoConfig?.extra);
  if (!parsed.success) throw new OAuthError('configuration');
}
