'use client';

import { ErrorFallback } from '@/components/error-fallback';

export default function ContractDetailError({
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
      title="Error al cargar el contrato"
      description="No se pudo mostrar los detalles del contrato. Puedes intentar de nuevo o volver a la lista."
    />
  );
}
