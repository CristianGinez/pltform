'use client';

import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Show "Go back" button instead of "Go home" */
  showBack?: boolean;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Compact mode for nested layouts (no full-screen centering) */
  compact?: boolean;
}

export function ErrorFallback({
  error,
  reset,
  showBack = false,
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.',
  compact = false,
}: ErrorFallbackProps) {
  const wrapper = compact
    ? 'flex flex-col items-center justify-center py-16 px-4'
    : 'min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50';

  return (
    <div className={wrapper}>
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-red-500" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{description}</p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-red-400 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            Intentar de nuevo
          </button>

          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              Volver
            </button>
          ) : (
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home size={15} />
              Ir al inicio
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
