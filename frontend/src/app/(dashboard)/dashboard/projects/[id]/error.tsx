'use client';

import { ErrorFallback } from '@/components/error-fallback';

export default function ProjectDetailError({
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
      showBack
      title="Error al cargar el proyecto"
      description="No se pudo mostrar los detalles del proyecto. Puedes intentar de nuevo o volver."
    />
  );
}
