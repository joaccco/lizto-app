import { z } from 'zod';
import { httpClient } from '@/core/api/httpClient';
import { instantSchema } from '@/core/domain/time';
import { loginResponseSchema } from '../schemas/authSchema';
import { oauthChallengeSchema, oauthProviderSchema, oauthLinkResponseSchema } from './oauthFlow';
import type { OAuthBackend, OAuthProvider } from './oauthFlow';

const challengeResponseSchema = z.object({ data: oauthChallengeSchema.extend({ expires_at: instantSchema }) });

export function createOAuthBackend(mode: 'login' | 'link'): OAuthBackend {
  const requiresAuth = mode === 'link';
  const challengePath = mode === 'link' ? '/auth/oauth/link/challenge' : '/auth/oauth/challenge';
  const exchangePath = mode === 'link' ? '/auth/oauth/link' : '/auth/oauth/login';
  return {
    async begin(provider: OAuthProvider) {
      const response = await httpClient(challengePath, challengeResponseSchema, {
        method: 'POST', requiresAuth, body: JSON.stringify({ provider: oauthProviderSchema.parse(provider) }),
      });
      return response.data;
    },
    async exchange(proof, challenge) {
      const options = { method: 'POST', requiresAuth, body: JSON.stringify({ ...proof, nonce: challenge.nonce }) };
      return mode === 'link'
        ? httpClient(exchangePath, oauthLinkResponseSchema, options)
        : httpClient(exchangePath, loginResponseSchema, options);
    },
  };
}
