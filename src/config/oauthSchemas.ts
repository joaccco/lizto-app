import { z } from 'zod';

const googleClientIdSchema = z.string().regex(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
export const googleOAuthConfigSchema = z.object({
  iosClientId: googleClientIdSchema,
  webClientId: googleClientIdSchema,
}).refine(config => config.iosClientId.split('-')[0] === config.webClientId.split('-')[0], {
  message: 'Google OAuth clients must belong to the same project.',
});
