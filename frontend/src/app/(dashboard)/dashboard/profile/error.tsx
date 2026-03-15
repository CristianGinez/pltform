'use client';

import { ErrorFallback } from '@/components/error-fallback';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      compact
      title="Error al cargar el perfil"
      description="No se pudo mostrar tu perfil. Tus datos están seguros. Intenta de nuevo."
    />
  );
}
