import { create } from 'zustand';
import { saveToken, removeToken, saveActiveRole, getActiveRole, getToken } from '@/core/security/secureStore';

export type Role = 'provider' | 'client';

interface AuthState {
  token: string | null;
  activeRole: Role;
  isInitialized: boolean;
  setSession: (token: string, activeRole?: Role) => Promise<void>;
  setActiveRole: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  activeRole: 'provider',
  isInitialized: false,

  initializeSession: async () => {
    const token = await getToken();
    const storedRole = await getActiveRole();
    const activeRole: Role = storedRole === 'client' ? 'client' : 'provider';

    set({
      token,
      activeRole,
      isInitialized: true,
    });
  },

  setSession: async (token: string, activeRole: Role = 'provider') => {
    await saveToken(token);
    await saveActiveRole(activeRole);
    set({ token, activeRole });
  },

  setActiveRole: async (role: Role) => {
    await saveActiveRole(role);
    set({ activeRole: role });
  },

  logout: async () => {
    await removeToken();
    set({ token: null });
  },
}));
