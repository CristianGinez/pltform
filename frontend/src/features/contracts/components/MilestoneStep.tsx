'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, AlertCircle, Lock,
  Rocket, Send, RotateCcw, ThumbsUp,
  Activity, Eye, ExternalLink,
} from 'lucide-react';
import { useMarkReadyForTesting, useForceApprove, useSendProgressUpdate } from '@/hooks/use-contracts';
import type { Milestone } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, STEP_COLORS } from '../constants';
import { ProposeModal } from './ProposeModal';

// ─── Progress update modal ────────────────────────────────────────────────────

function ProgressUpdateModal({ milestone, contractId, onClose }: { milestone: Milestone; contractId: string; onClose: () => void }) {
  const [note, setNote] = useState('');
  const sendUpdate = useSendProgressUpdate(contractId);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Enviar actualización</h2>
            <p className="text-xs text-gray-400 mt-0.5">{milestone.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <AlertCircle size={15} className="text-gray-400" />
          </button>
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          rows={3} autoFocus placeholder="¿En qué estás trabajando? ¿Qué avances tienes? ¿Algún bloqueo?"
          value={note} onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => sendUpdate.mutate({ milestoneId: milestone.id, note }, { onSuccess: onClose })}
            disabled={!note.trim() || sendUpdate.isPending}
            className="flex-1 py-2 text-sm font-semibold bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {sendUpdate.isPending ? 'Enviando...' : 'Enviar actualización'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Milestone step ───────────────────────────────────────────────────────────

interface MilestoneStepProps {
  milestone: Milestone;
  index: number;
  total: number;
  contractId: string;
  isCompany: boolean;
  locked: boolean;
  onProposed?: () => void;
}

export function MilestoneStep({ milestone, index, total, contractId, isCompany, locked, onProposed }: MilestoneStepProps) {
  const [modal, setModal] = useState<'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE' | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [confirmTesting, setConfirmTesting] = useState(false);
  const [confirmForceApprove, setConfirmForceApprove] = useState(false);
  const readyForTesting = useMarkReadyForTesting(contractId);
  const forceApprove = useForceApprove();

  const colors = STEP_COLORS[milestone.status];
  const isDone = milestone.status === 'APPROVED' || milestone.status === 'PAID';
  const isActive = ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED'].includes(milestone.status);

  const daysSinceSubmission = milestone.submittedAt
    ? Math.floor((Date.now() - new Date(milestone.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const canForceApprove = !isCompany && milestone.status === 'SUBMITTED' && daysSinceSubmission !== null && daysSinceSubmission >= 7;
  const daysRemaining = !isCompany && milestone.status === 'SUBMITTED' && daysSinceSubmission !== null && daysSinceSubmission < 7
    ? 7 - daysSinceSubmission
    : null;

  const devActions: { label: string; icon: React.ReactNode; onClick: () => void; style: string }[] = [];
  if (!isCompany && !locked) {
    if (milestone.status === 'PENDING') {
      devActions.push({ label: 'Proponer inicio', icon: <Rocket size={12} />, onClick: () => setModal('PROPOSE_START'), style: 'bg-blue-600 text-white hover:bg-blue-700' });
    }
    if (milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') {
      devActions.push(
        { label: 'Enviar actualización', icon: <Activity size={12} />, onClick: () => setShowProgressModal(true), style: 'bg-sky-100 text-sky-700 hover:bg-sky-200' },
        { label: 'Listo para testing', icon: <Eye size={12} />, onClick: () => setConfirmTesting(true), style: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
        { label: milestone.status === 'REVISION_REQUESTED' ? 'Proponer re-entrega' : 'Proponer entrega', icon: <Send size={12} />, onClick: () => setModal('PROPOSE_SUBMIT'), style: 'bg-primary-600 text-white hover:bg-primary-700' },
      );
    }
  }

  const companyActions: { label: string; icon: React.ReactNode; onClick: () => void; style: string }[] = [];
  if (isCompany && milestone.status === 'SUBMITTED') {
    companyActions.push(
      { label: 'Proponer aprobación', icon: <ThumbsUp size={12} />, onClick: () => setModal('PROPOSE_APPROVE'), style: 'bg-green-600 text-white hover:bg-green-700' },
      { label: 'Pedir revisión', icon: <RotateCcw size={12} />, onClick: () => setModal('PROPOSE_REVISION'), style: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    );
  }

  const allActions = isCompany ? companyActions : devActions;

  return (
    <>
      <div className="flex gap-3">
        <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 shrink-0 ${
            isDone ? 'bg-emerald-500 border-emerald-500 text-white'
            : isActive ? 'bg-white border-primary-500 text-primary-700 shadow-sm shadow-primary-100'
            : locked ? 'bg-gray-100 border-gray-200 text-gray-400'
            : 'bg-white border-gray-300 text-gray-500'
          }`}>
            {isDone ? <CheckCircle size={15} /> : locked ? <Lock size={11} /> : <span>{index + 1}</span>}
          </div>
          {index < total - 1 && (
            <div className={`w-0.5 flex-1 my-1 min-h-4 rounded-full ${isDone ? 'bg-emerald-300' : isActive ? 'bg-primary-200' : 'bg-gray-200'}`} />
          )}
        </div>

        <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06 }}
          className={`flex-1 mb-3 rounded-xl border border-gray-100 border-l-4 p-4 ${colors.bg} ${colors.leftBorder} ${locked ? 'opacity-60' : ''}`}>

          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`font-semibold text-sm min-w-0 flex-1 [overflow-wrap:anywhere] ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {milestone.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[milestone.status]}`}>
                {STATUS_LABELS[milestone.status]}
              </span>
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap">S/ {Number(milestone.amount).toLocaleString()}</span>
            </div>
          </div>

          {milestone.description && (
            <p className="text-xs text-gray-500 mb-2 leading-relaxed [overflow-wrap:anywhere]">{milestone.description}</p>
          )}

          {(milestone.dueDate || milestone.startedAt || milestone.submittedAt) && (
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 mb-2">
              {milestone.dueDate && <span>Límite: {new Date(milestone.dueDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
              {milestone.startedAt && <span className="text-blue-500">Iniciado: {new Date(milestone.startedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
              {milestone.submittedAt && <span className="text-yellow-600">Entregado: {new Date(milestone.submittedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
            </div>
          )}

          {['SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'PAID'].includes(milestone.status) &&
            (milestone.deliveryNote || milestone.deliveryLink) && (
              <div className="bg-white/80 rounded-lg p-3 mb-3 text-xs border border-white/60">
                {milestone.deliveryNote && (
                  <p className="text-gray-700 mb-1 [overflow-wrap:anywhere]"><span className="font-medium">Nota de entrega:</span> {milestone.deliveryNote}</p>
                )}
                {milestone.deliveryLink && (
                  <a href={milestone.deliveryLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                    <ExternalLink size={10} />Ver entregable
                  </a>
                )}
              </div>
            )}

          {locked && !isCompany && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Lock size={10} />Completa el milestone anterior para desbloquear
            </p>
          )}

          {allActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {allActions.map((a) => (
                <button key={a.label} onClick={a.onClick}
                  disabled={readyForTesting.isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-60 cursor-pointer ${a.style}`}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          )}

          {canForceApprove && (
            <div className="mt-3 pt-3 border-t border-orange-100">
              <button
                onClick={() => setConfirmForceApprove(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer">
                <AlertCircle size={12} />Aprobación automática disponible (7 días sin respuesta)
              </button>
            </div>
          )}
          {daysRemaining !== null && (
            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
              <Clock size={10} />La empresa tiene {daysRemaining} día{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''} para responder
            </p>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {modal && (
          <ProposeModal milestone={milestone} contractId={contractId} action={modal} onClose={() => setModal(null)} onProposed={onProposed} />
        )}
        {showProgressModal && (
          <ProgressUpdateModal milestone={milestone} contractId={contractId} onClose={() => setShowProgressModal(false)} />
        )}
        {confirmTesting && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 text-center">
              <Eye size={32} className="text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">¿Listo para testing?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Se notificará a la empresa que <span className="font-medium">"{milestone.title}"</span> está listo para revisión o testing.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmTesting(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={() => { readyForTesting.mutate(milestone.id, { onSuccess: () => setConfirmTesting(false) }); }}
                  disabled={readyForTesting.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-60 cursor-pointer">
                  {readyForTesting.isPending ? 'Enviando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {confirmForceApprove && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 text-center">
              <AlertCircle size={32} className="text-orange-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Aprobación automática</h3>
              <p className="text-sm text-gray-500 mb-4">
                Han pasado {daysSinceSubmission} días desde que entregaste <span className="font-medium">"{milestone.title}"</span> sin respuesta. ¿Confirmar aprobación automática?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmForceApprove(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={() => forceApprove.mutate(
                    { contractId, milestoneId: milestone.id },
                    { onSuccess: () => setConfirmForceApprove(false) },
                  )}
                  disabled={forceApprove.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60 cursor-pointer">
                  {forceApprove.isPending ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
