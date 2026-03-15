'use client';

import { ErrorFallback } from '@/components/error-fallback';

export default function AuthError({
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
      title="Error en la autenticación"
      description="Ocurrió un error. Puedes intentar de nuevo o volver al inicio."
    />
  );
}
