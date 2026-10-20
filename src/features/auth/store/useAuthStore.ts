import { create } from 'zustand';
import { saveToken, removeToken, getToken } from '@/core/security/secureStore';

export type Role = 'provider' | 'client';

interface AuthState {
  token: string | null;
  activeRole: Role | null;
  isInitialized: boolean;
  storageError: 'read' | 'delete' | null;
  setSession: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  activeRole: null,
  isInitialized: false,
  storageError: null,
  initializeSession: async () => {
    try {
      const token = await getToken();
      set({ token, activeRole: null, isInitialized: true, storageError: null });
    } catch {
      set({ token: null, activeRole: null, isInitialized: true, storageError: 'read' });
    }
  },
  setSession: async (token) => {
    try {
      await saveToken(token);
      set({ token, activeRole: null, storageError: null });
    } catch (error) {
      try { await removeToken(); }
      catch { set({ storageError: 'delete' }); }
      throw error;
    }
  },
  logout: async () => {
    try {
      await removeToken();
      set({ token: null, activeRole: null, storageError: null });
    } catch (error) {
      set({ activeRole: null, storageError: 'delete' });
      throw error;
    }
  },
}));
