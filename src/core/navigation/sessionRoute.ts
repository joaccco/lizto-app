import type { Role } from '@/features/auth/store/useAuthStore';
export function sessionRedirect({ token, role, group }: { token: string | null; role: Role | null; group: string | undefined }): '/(cliente)' | '/(pro)' | '/(auth)/login' | null {
  if (!token) return group === '(pro)' || group === 'chat' ? '/(auth)/login' : null;
  if (!role) return null;
  if (group === '(auth)' || (group === '(pro)' && role === 'client') || (group === '(cliente)' && role === 'provider')) {
    return role === 'provider' ? '/(pro)' : '/(cliente)';
  }
  return null;
}
