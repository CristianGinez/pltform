'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useProposeAction } from '@/hooks/use-contracts';
import type { Milestone } from '@/types';

type ProposeAction = 'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE';

interface ProposeModalProps {
  milestone: Milestone;
  contractId: string;
  action: ProposeAction;
  onClose: () => void;
  onProposed?: () => void;
}

const TITLES: Record<ProposeAction, string> = {
  PROPOSE_START: 'Proponer inicio del desarrollo',
  PROPOSE_SUBMIT: 'Proponer entrega de milestone',
  PROPOSE_REVISION: 'Proponer revisión',
  PROPOSE_APPROVE: 'Proponer aprobación y pago',
};

const CONFIRM_LABELS: Record<ProposeAction, string> = {
  PROPOSE_START: 'Enviar propuesta de inicio',
  PROPOSE_SUBMIT: 'Enviar propuesta de entrega',
  PROPOSE_REVISION: 'Enviar propuesta de revisión',
  PROPOSE_APPROVE: 'Enviar propuesta de aprobación',
};

export function ProposeModal({ milestone, contractId, action, onClose, onProposed }: ProposeModalProps) {
  const propose = useProposeAction(contractId);
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [reason, setReason] = useState('');

  const handleSend = () => {
    propose.mutate(
      { milestoneId: milestone.id, action, deliveryNote: note || undefined, deliveryLink: link || undefined, reason: reason || undefined },
      { onSuccess: () => { onClose(); onProposed?.(); } },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{TITLES[action]}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{milestone.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {action === 'PROPOSE_SUBMIT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota de entrega</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3} placeholder="Describe qué entregaste..."
                  value={note} onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link al entregable</label>
                <input type="url"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)}
                />
              </div>
            </>
          )}
          {action === 'PROPOSE_REVISION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué necesita revisión?</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3} placeholder="Describe el problema o qué debe cambiar..."
                value={reason} onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          {action === 'PROPOSE_START' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cómo vas a abordar este milestone? <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3} placeholder="Describe brevemente cómo lo vas a implementar, tecnologías, pasos..."
                value={note} onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
          {action === 'PROPOSE_APPROVE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario para el developer <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3} placeholder="¡Buen trabajo! Puedes añadir un comentario o feedback..."
                value={note} onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={propose.isPending}
              className="flex-1 px-4 py-2.5 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 font-medium cursor-pointer"
            >
              {propose.isPending ? 'Enviando...' : CONFIRM_LABELS[action]}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
