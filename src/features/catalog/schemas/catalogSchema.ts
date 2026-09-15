import { z } from 'zod';

// Categories are identified by slug in CategoryResource, unlike users and requests.
export const categorySchema = z.object({ id: z.string(), name: z.string(), slug: z.string(), icon: z.string().nullable() });
export const categoriesResponseSchema = z.object({ data: z.array(categorySchema.extend({ children: z.array(categorySchema).optional() })) });
export type Category = z.infer<typeof categorySchema>;

// Only allow fields used by this UI through the boundary. In particular, discard
// contact details and exact locations returned by the current public endpoint.
export const providerSchema = z.object({
  uuid: z.string().uuid(), name: z.string(), bio: z.string().nullable(),
  category_name: z.string(), specialties: z.array(z.string()),
  avg_rating: z.number(), total_reviews: z.number().int().nonnegative(),
  is_verified: z.boolean(), availability_status: z.string(),
});
export const providersResponseSchema = z.object({
  data: z.array(providerSchema),
  meta: z.object({ current_page: z.number().int().positive(), per_page: z.number().int().positive(), total: z.number().int().nonnegative() }),
});
export type Provider = z.infer<typeof providerSchema>;
