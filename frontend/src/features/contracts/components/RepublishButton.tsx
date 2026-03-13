'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { useRepublishProject, useRevertToDraft } from '@/hooks/use-projects';

export function RepublishButton({ projectId }: { projectId: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const republish = useRepublishProject(projectId);

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
      >
        Republicar proyecto
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Confirmar republicación?</span>
      <button
        onClick={() => republish.mutate()}
        disabled={republish.isPending}
        className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 cursor-pointer"
      >
        {republish.isPending ? 'Publicando...' : 'Sí, publicar'}
      </button>
      <button
        onClick={() => setConfirmed(false)}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );
}

export function RevertToDraftButton({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const revert = useRevertToDraft(projectId);

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Edit3 size={11} />Editar como borrador
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">¿Convertir a borrador?</span>
      <button
        onClick={() => revert.mutate(undefined, { onSuccess })}
        disabled={revert.isPending}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60 cursor-pointer"
      >
        {revert.isPending ? 'Procesando...' : 'Sí, editar'}
      </button>
      <button
        onClick={() => setConfirmed(false)}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );
}
