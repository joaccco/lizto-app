import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { httpClient } from '@/core/api/httpClient';
import { categoriesResponseSchema, providersResponseSchema } from '../schemas/catalogSchema';

export function useCategories() {
  return useQuery({ queryKey: ['catalog', 'categories'], queryFn: async () => {
    const result = await httpClient('/categories', categoriesResponseSchema, { requiresAuth: false });
    return result.data.flatMap(category => category.children?.length ? category.children : [category]);
  } });
}
export function useProviders(category?: string) {
  return useInfiniteQuery({
    queryKey: ['catalog', 'providers', category], initialPageParam: 1,
    queryFn: ({ pageParam }) => httpClient(`/providers?page=${pageParam}${category ? `&category=${encodeURIComponent(category)}` : ''}`, providersResponseSchema, { requiresAuth: false }),
    getNextPageParam: ({ meta }) => meta.current_page * meta.per_page < meta.total ? meta.current_page + 1 : undefined,
  });
}
