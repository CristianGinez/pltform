'use client';

import { useAuthStore } from '@/store/auth.store';
import { LandingPage } from './_landing/LandingPage';
import { AuthenticatedHome } from './_landing/AuthenticatedHome';

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return user ? <AuthenticatedHome /> : <LandingPage />;
}
