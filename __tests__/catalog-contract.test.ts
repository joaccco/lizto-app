import { categoriesResponseSchema, providersResponseSchema } from '@/features/catalog/schemas/catalogSchema';
import { clientRequestsResponseSchema } from '@/features/client-requests/schemas/clientRequestSchema';

const provider = { uuid: '50a4fae0-56ee-4d79-820d-b5d9ad564ef3', name: 'Profesional de prueba', bio: null, category_name: 'Electricidad', specialties: [], avg_rating: 0, total_reviews: 0, is_verified: false, availability_status: 'available' };
const meta = { current_page: 1, per_page: 15, total: 1 };
test('El catálogo elimina domicilios, coordenadas y contacto antes de llegar a las vistas', () => {
  const response = providersResponseSchema.parse({ data: [{ ...provider, email: 'private@example.com', location: { lat: -34, lng: -58, address: 'Privado' }, base_address: 'Privado' }], meta });
  expect(response.data[0]).not.toHaveProperty('location');
  expect(response.data[0]).not.toHaveProperty('email');
  expect(response.data[0]).not.toHaveProperty('base_address');
});
test('Rechaza profesionales sin UUID y paginación inválida', () => {
  expect(providersResponseSchema.safeParse({ data: [{ ...provider, uuid: '123' }], meta }).success).toBe(false);
  expect(providersResponseSchema.safeParse({ data: [provider], meta: { ...meta, per_page: 0 } }).success).toBe(false);
});
test('Respeta categorías por slug y categorías hijas del contrato Laravel', () => {
  const category = { id: 'electricidad', slug: 'electricidad', name: 'Electricidad', icon: null };
  expect(categoriesResponseSchema.parse({ data: [{ ...category, children: [category] }] }).data[0].children?.[0].slug).toBe('electricidad');
});
test('Las solicitudes no aceptan fechas sin zona ni estados desconocidos', () => {
  const item = { uuid: provider.uuid, raw_prompt: 'Arreglo', full_prompt: 'Arreglo', status: 'active', category: null, conversation_id: null, created_at: '2026-09-08T12:00:00Z' };
  const page = { current_page: 1, last_page: 1, total: 1 };
  expect(clientRequestsResponseSchema.safeParse({ data: [item], meta: page }).success).toBe(true);
  expect(clientRequestsResponseSchema.safeParse({ data: [{ ...item, created_at: '2026-09-08T12:00:00' }], meta: page }).success).toBe(false);
  expect(clientRequestsResponseSchema.safeParse({ data: [{ ...item, status: 'inventado' }], meta: page }).success).toBe(false);
});
