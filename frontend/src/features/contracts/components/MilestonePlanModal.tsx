'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useProposeMilestonePlan } from '@/hooks/use-contracts';

export function MilestonePlanModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const propose = useProposeMilestonePlan(contractId);
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: 0, order: 1 },
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: 0, order: milestones.length + 1 }]);
  };

  const removeMilestone = (i: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const update = (i: number, field: string, value: string | number) => {
    setMilestones(milestones.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const isValid = milestones.every((m) => m.title.trim() && m.amount > 0);
  const total = milestones.reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Proponer plan de milestones</h2>
            <p className="text-xs text-gray-500 mt-0.5">Define las etapas y precios del proyecto</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Milestone {i + 1}</span>
                {milestones.length > 1 && (
                  <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                    <X size={14} />
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Título del milestone *"
                value={m.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={m.description}
                onChange={(e) => update(i, 'description', e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">S/</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Monto *"
                  value={m.amount || ''}
                  onChange={(e) => update(i, 'amount', Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addMilestone}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <Plus size={14} />Agregar milestone
          </button>

          <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total propuesto</span>
            <span className="text-sm font-bold text-gray-900">S/ {total.toLocaleString()}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              Cancelar
            </button>
            <button
              onClick={() => propose.mutate(milestones.map((m, i) => ({ ...m, order: i + 1 })), { onSuccess: onClose })}
              disabled={!isValid || propose.isPending}
              className="flex-1 px-4 py-2.5 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 font-medium cursor-pointer"
            >
              {propose.isPending ? 'Enviando...' : 'Enviar plan'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
