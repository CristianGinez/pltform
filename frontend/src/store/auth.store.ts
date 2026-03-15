import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/query-client';

export interface AuthUser {
  id: string;
  email: string;
  role: 'COMPANY' | 'DEVELOPER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // Called on login/register — sets everything
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        set({ token, refreshToken, user });
      },

      // Called by axios interceptor on silent refresh — only updates tokens
      setTokens: (token, refreshToken) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        set({ token, refreshToken });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.clear();
        set({ token: null, refreshToken: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync tokens back to localStorage so axios interceptor always finds them
        if (state?.token) localStorage.setItem('access_token', state.token);
        if (state?.refreshToken) localStorage.setItem('refresh_token', state.refreshToken);
        state?.setHasHydrated(true);
      },
    },
  ),
);
