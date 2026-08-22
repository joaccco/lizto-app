import { create } from 'zustand';
import { saveToken, removeToken, saveActiveRole, getActiveRole, getToken } from '@/core/security/secureStore';
import { User } from '../schemas/authSchema';

export type Role = 'provider' | 'client';

interface AuthState {
  token: string | null;
  activeRole: Role | null;
  isInitialized: boolean;
  setSession: (token: string, initialRole?: Role) => Promise<void>;
  deriveActiveRoleFromUser: (user: User) => Promise<Role>;
  setActiveRole: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  activeRole: null,
  isInitialized: false,

  initializeSession: async () => {
    const token = await getToken();
    const storedRole = await getActiveRole();
    const activeRole: Role | null = storedRole === 'client' || storedRole === 'provider' ? storedRole : null;

    set({
      token,
      activeRole,
      isInitialized: true,
    });
  },

  deriveActiveRoleFromUser: async (user: User): Promise<Role> => {
    const roles = user.roles;
    const hasProvider = roles.includes('provider');
    const hasClient = roles.includes('client');
    const storedRole = await getActiveRole();

    let targetRole: Role;
    if (hasProvider && !hasClient) {
      targetRole = 'provider';
    } else if (hasClient && !hasProvider) {
      targetRole = 'client';
    } else if (hasProvider && hasClient) {
      targetRole = storedRole && (storedRole === 'provider' || storedRole === 'client') ? storedRole : 'provider';
    } else {
      targetRole = 'client';
    }

    await saveActiveRole(targetRole);
    set({ activeRole: targetRole });
    return targetRole;
  },

  setSession: async (token: string, initialRole?: Role) => {
    await saveToken(token);
    if (initialRole) {
      await saveActiveRole(initialRole);
      set({ token, activeRole: initialRole });
    } else {
      set({ token });
    }
  },

  setActiveRole: async (role: Role) => {
    await saveActiveRole(role);
    set({ activeRole: role });
  },

  logout: async () => {
    await removeToken();
    set({ token: null, activeRole: null });
  },
}));
