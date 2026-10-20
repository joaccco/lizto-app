import type { Role } from '../store/useAuthStore';

export type RoleResolution =
  | { status: 'resolved'; role: Role }
  | { status: 'selection_required' }
  | { status: 'unsupported' };

/** A stored preference is valid only while the server still grants that role. */
export function resolveRole(roles: readonly string[], preference: Role | null): RoleResolution {
  const available = roles.filter((role): role is Role => role === 'client' || role === 'provider');
  const distinct = [...new Set(available)];
  if (distinct.length === 0) return { status: 'unsupported' };
  if (distinct.length === 1) return { status: 'resolved', role: distinct[0]! };
  if (preference && distinct.includes(preference)) return { status: 'resolved', role: preference };
  return { status: 'selection_required' };
}
