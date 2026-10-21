import { z } from 'zod';
import { loginResponseSchema, userSchema } from '../schemas/authSchema';

export const oauthProviderSchema = z.enum(['google', 'facebook']);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

// Internal ports; OAuthBackend maps them to the implemented API contract.
export const oauthChallengeSchema = z.object({ nonce: z.string().regex(/^[a-f0-9]{64}$/i) });
export type OAuthChallenge = z.infer<typeof oauthChallengeSchema>;
const proofValue = z.string().trim().min(1);
export const oauthProofSchema = z.discriminatedUnion('kind', [
  z.object({ provider: z.literal('google'), kind: z.literal('google_id_token'), value: proofValue }),
  z.object({ provider: z.literal('facebook'), kind: z.literal('facebook_limited_token'), value: proofValue }),
  z.object({ provider: z.literal('facebook'), kind: z.literal('facebook_access_token'), value: proofValue }),
]);
export type OAuthProof = z.infer<typeof oauthProofSchema>;
export const oauthLinkResponseSchema = z.object({ data: z.object({ user: userSchema }), message: z.string() });
export type NativeOAuthResult = { status: 'cancelled' } | { status: 'success'; proof: OAuthProof };

export interface OAuthBackend {
  begin(provider: OAuthProvider): Promise<unknown>;
  exchange(proof: OAuthProof, challenge: OAuthChallenge): Promise<unknown>;
}
export type OAuthAuthorize = (provider: OAuthProvider, challenge: OAuthChallenge) => Promise<NativeOAuthResult>;

export class OAuthError extends Error {
  constructor(public readonly code: 'configuration' | 'unsupported_platform' | 'missing_proof' | 'provider_mismatch') {
    super(`OAUTH_ERROR: ${code}`);
    this.name = 'OAuthError';
  }
}

function createProofFlow<T extends object>(backend: OAuthBackend, authorize: OAuthAuthorize, validate: (value: unknown) => T) {
  let busy = false;
  return async (provider: OAuthProvider) => {
    if (busy) return { status: 'busy' as const };
    busy = true;
    try {
      const selected = oauthProviderSchema.parse(provider);
      const challenge = oauthChallengeSchema.parse(await backend.begin(selected));
      const result = await authorize(selected, challenge);
      if (result.status === 'cancelled') return { status: 'cancelled' as const };
      const proof = oauthProofSchema.parse(result.proof);
      if (proof.provider !== selected) throw new OAuthError('provider_mismatch');
      const output = validate(await backend.exchange(proof, challenge));
      // The caller may now establish the Lizto session using the existing Secure Store flow.
      // Native credentials alone never authorize the user or determine roles.
      return { status: 'success' as const, ...output };
    } finally {
      busy = false;
    }
  };
}

export function createOAuthFlow(backend: OAuthBackend, authorize: OAuthAuthorize) {
  return createProofFlow(backend, authorize, value => ({ session: loginResponseSchema.parse(value) }));
}

export function createOAuthLinkFlow(backend: OAuthBackend, authorize: OAuthAuthorize) {
  return createProofFlow(backend, authorize, value => ({ user: oauthLinkResponseSchema.parse(value).data.user }));
}
