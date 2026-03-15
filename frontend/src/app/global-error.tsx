'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 font-sans">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Algo salió mal</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-xs font-mono text-red-700 break-all">{error.message}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
              Recargar
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
