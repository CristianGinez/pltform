'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRespondToProposal } from '@/hooks/use-contracts';

export function CounterModal({
  messageId, contractId, onClose,
}: { messageId: string; contractId: string; onClose: () => void }) {
  const respond = useRespondToProposal(contractId);
  const [counter, setCounter] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Enviar contraoferta</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
          rows={3} placeholder="Describe tu contraoferta o los cambios que propones..."
          value={counter} onChange={(e) => setCounter(e.target.value)} autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => respond.mutate({ messageId, response: 'counter', counter }, { onSuccess: onClose })}
            disabled={!counter.trim() || respond.isPending}
            className="flex-1 px-4 py-2.5 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60 font-medium cursor-pointer"
          >
            {respond.isPending ? 'Enviando...' : 'Enviar contraoferta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
