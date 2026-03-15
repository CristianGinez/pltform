'use client';

import { ErrorFallback } from '@/components/error-fallback';

export default function DashboardError({
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
      title="Error en el dashboard"
      description="Algo salió mal al cargar esta sección. Tu sesión sigue activa."
    />
  );
}
