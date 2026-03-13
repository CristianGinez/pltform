'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Zap } from 'lucide-react';
import type { Milestone, MilestoneStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { MilestoneStep } from './MilestoneStep';
import { MilestonePlanModal } from './MilestonePlanModal';

interface MilestonesTabProps {
  milestones: Milestone[];
  contractId: string;
  isCompany: boolean;
  onProposed?: () => void;
}

export function MilestonesTab({ milestones, contractId, isCompany, onProposed }: MilestonesTabProps) {
  const done = milestones.filter((m) => m.status === 'PAID').length;
  const hasStarted = milestones.some((m) => ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED'].includes(m.status));
  const rawPct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;
  const pct = hasStarted && rawPct < 5 ? 5 : rawPct;
  const [showPlanModal, setShowPlanModal] = useState(false);

  const isLocked = (index: number) => {
    if (isCompany) return false;
    for (let i = 0; i < index; i++) {
      if (milestones[i].status !== 'PAID') return true;
    }
    return false;
  };

  return (
    <div className="space-y-3">
      {milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Ruta del proyecto</span>
            <span className="text-xs text-gray-400">{done}/{milestones.length} completados · {pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-linear-to-r from-primary-400 to-emerald-500 h-2 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {(['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'PAID'] as MilestoneStatus[]).map((s) => {
              const count = milestones.filter((m) => m.status === s).length;
              if (!count) return null;
              return (
                <span key={s} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s]}`}>
                  {count} {STATUS_LABELS[s]}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">Este contrato no tiene milestones definidos.</p>
          {!isCompany && (
            <button
              onClick={() => setShowPlanModal(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <ListChecks size={15} />
              Proponer plan de milestones
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {showPlanModal && (
          <MilestonePlanModal contractId={contractId} onClose={() => setShowPlanModal(false)} />
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
          <Zap size={12} />Tareas del proyecto
        </p>
        {milestones.map((m, i) => (
          <MilestoneStep
            key={m.id}
            milestone={m}
            index={i}
            total={milestones.length}
            contractId={contractId}
            isCompany={isCompany}
            locked={isLocked(i)}
            onProposed={onProposed}
          />
        ))}
      </div>
    </div>
  );
}
