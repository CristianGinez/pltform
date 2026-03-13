'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useOpenDispute } from '@/hooks/use-contracts';

export function DisputeModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const openDispute = useOpenDispute(contractId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={20} className="text-red-500" />
          <h3 className="font-semibold text-gray-900">Abrir disputa</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Explica el motivo de la disputa. Un administrador revisará el caso y resolverá a la brevedad.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-1"
          rows={4}
          placeholder="¿Por qué estás abriendo esta disputa? (min. 10 caracteres)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="text-[10px] text-gray-400 mb-4">{reason.length} / 10 mínimo</p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => openDispute.mutate(reason, { onSuccess: onClose })}
            disabled={reason.trim().length < 10 || openDispute.isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 cursor-pointer">
            {openDispute.isPending ? 'Enviando...' : 'Abrir disputa'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
