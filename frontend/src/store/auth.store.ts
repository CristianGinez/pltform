import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: 'COMPANY' | 'DEVELOPER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setAuth: (token, user) => {
        localStorage.setItem('access_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
