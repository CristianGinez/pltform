'use client';

import { useState } from 'react';
import { Edit3, Rocket } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useRepublishProject, useRevertToDraft } from '@/hooks/use-projects';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export function RepublishButton({ projectId }: { projectId: string }) {
  const [showModal, setShowModal] = useState(false);
  const republish = useRepublishProject(projectId);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
      >
        Republicar proyecto
      </button>

      <AnimatePresence>
        {showModal && (
          <ConfirmModal
            title="¿Republicar proyecto?"
            message="El proyecto volverá a estar visible y abierto para nuevas propuestas."
            confirmText="Sí, publicar"
            cancelText="Cancelar"
            variant="primary"
            icon={<Rocket size={32} className="text-primary-500" />}
            loading={republish.isPending}
            onConfirm={() => republish.mutate(undefined, { onSuccess: () => setShowModal(false) })}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function RevertToDraftButton({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const revert = useRevertToDraft(projectId);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Edit3 size={11} /> Editar como borrador
      </button>

      <AnimatePresence>
        {showModal && (
          <ConfirmModal
            title="¿Convertir a borrador?"
            message="El proyecto dejará de estar visible para los developers. Podrás editarlo y volver a publicarlo cuando quieras."
            confirmText="Sí, editar"
            cancelText="Cancelar"
            variant="warning"
            icon={<Edit3 size={32} className="text-orange-400" />}
            loading={revert.isPending}
            onConfirm={() => revert.mutate(undefined, { onSuccess: () => { setShowModal(false); onSuccess(); } })}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
