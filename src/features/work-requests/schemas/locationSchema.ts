import { z } from 'zod';

export const locationFields = {
  location_address: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  is_approximate: z.boolean().optional(),
  location_radius_meters: z.number().positive().nullable().optional(),
};
const locationSchema = z.object({ status: z.string(), ...locationFields });
type LocationData = z.infer<typeof locationSchema>;
const confirmedStates = new Set(['confirmed', 'in_progress', 'pending_completion', 'completed']);

// Protección previa a caché/UI. La marca aproximada es parte del contrato del servidor.
export function redactUnconfirmedLocation<T extends LocationData>(value: T) {
  const exactAllowed = confirmedStates.has(value.status) && value.is_approximate === false;
  const approximate = value.is_approximate === true;
  const safeAddress = exactAllowed || approximate ? value.location_address ?? value.address ?? null : null;
  return {
    ...value,
    location_address: safeAddress,
    address: safeAddress,
    location_lat: exactAllowed ? value.location_lat : null,
    location_lng: exactAllowed ? value.location_lng : null,
    location_radius_meters: approximate ? value.location_radius_meters : null,
    privacy_violation: !approximate && !exactAllowed && Boolean(value.address || value.location_address || value.location_lat != null || value.location_lng != null),
  };
}
