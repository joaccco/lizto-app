import { z } from 'zod';
import { HttpError } from '@/core/api/httpClient';
import { OAuthError } from './oauthFlow';

const errorCodeSchema = z.object({ code: z.string() });
export function oauthErrorKey(error: unknown): string {
  if (error instanceof OAuthError) return error.code === 'configuration' ? 'oauth.notConfigured' : 'oauth.failed';
  if (error instanceof HttpError) {
    const parsed = errorCodeSchema.safeParse(error.body);
    const messages: Record<string, string> = {
      oauth_link_required: 'oauth.linkRequired', oauth_profile_incomplete: 'oauth.profileIncomplete',
      oauth_identity_conflict: 'oauth.identityConflict', oauth_account_restricted: 'auth.accountRestricted',
      oauth_not_configured: 'oauth.notConfigured', oauth_provider_unavailable: 'oauth.unavailable',
      oauth_invalid_challenge: 'oauth.expired', oauth_invalid_proof: 'oauth.failed',
    };
    if (parsed.success && messages[parsed.data.code]) return messages[parsed.data.code];
    if (error.status === 429) return 'auth.rateLimited';
    if (error.status === 403) return 'auth.accountRestricted';
    return error.status >= 500 ? 'oauth.unavailable' : 'oauth.failed';
  }
  return 'oauth.failed';
}
