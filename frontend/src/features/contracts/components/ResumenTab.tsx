'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, Trophy } from 'lucide-react';
import { useCreateReview, useContract } from '@/hooks/use-contracts';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { MilestoneStatusIcon } from '../utils';

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110">
          <Star size={28} className={`${(hover || value) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-colors`} />
        </button>
      ))}
    </div>
  );
}

// ─── Completion overlay ───────────────────────────────────────────────────────

interface CompletionOverlayProps {
  contract: NonNullable<ReturnType<typeof useContract>['data']>;
  currentUserId?: string;
  alreadyReviewed: boolean;
  skipAnimate?: boolean;
  ignoreStorage?: boolean;
  onClose?: () => void;
}

export function CompletionOverlay({ contract, currentUserId, alreadyReviewed, skipAnimate, ignoreStorage, onClose }: CompletionOverlayProps) {
  const [phase, setPhase] = useState<'animate' | 'review' | 'done'>(
    alreadyReviewed ? 'done' : skipAnimate ? 'review' : 'animate'
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview(contract.id);
  const dismissKey = `review-dismissed-${contract.id}-${currentUserId}`;
  const [dismissed, setDismissed] = useState(() => {
    if (ignoreStorage) return false;
    try { return !!localStorage.getItem(dismissKey); } catch { return false; }
  });

  useEffect(() => {
    if (phase === 'animate') {
      const t = setTimeout(() => setPhase('review'), 2200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (dismissed || (alreadyReviewed && phase === 'done')) return null;

  const isCompany = contract.project?.company?.userId === currentUserId;
  const otherName = isCompany
    ? (contract.project?.proposals?.[0]?.developer?.name ?? 'el developer')
    : (contract.project?.company?.name ?? 'la empresa');

  const handleSubmitReview = () => {
    if (!rating) return;
    createReview.mutate({ rating, comment: comment.trim() || undefined }, {
      onSuccess: () => { setPhase('done'); onClose?.(); },
    });
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {phase === 'animate' && (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-linear-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy size={36} className="text-white" />
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-gray-900 mb-2">¡Proyecto completado!</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                  className="text-gray-500 text-sm mb-6">Todos los milestones han sido pagados exitosamente.</motion.p>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-linear-to-r from-emerald-400 to-emerald-600 h-3 rounded-full"
                    initial={{ width: '80%' }} animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                  className="text-xs text-emerald-600 font-medium mt-2">100% completado</motion.p>
              </div>
            )}

            {phase === 'review' && (
              <div className="p-6">
                <div className="text-center mb-5">
                  <Award size={32} className="text-primary-500 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-gray-900">Califica a {otherName}</h3>
                  <p className="text-xs text-gray-400 mt-1">Tu opinión ayuda a mejorar la plataforma</p>
                </div>
                <div className="flex justify-center mb-4">
                  <StarRating value={rating} onChange={setRating} />
                </div>
                {rating > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center text-sm font-medium text-yellow-600 mb-3">
                    {rating === 5 ? '¡Excelente! ⭐' : rating === 4 ? 'Muy bueno 👍' : rating === 3 ? 'Aceptable' : rating === 2 ? 'Regular' : 'Necesita mejorar'}
                  </motion.p>
                )}
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                  rows={3} placeholder="Escribe un comentario (opcional)..."
                  value={comment} onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (!ignoreStorage) { try { localStorage.setItem(dismissKey, '1'); } catch {} }
                    setDismissed(true);
                    onClose?.();
                  }}
                    className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    Después
                  </button>
                  <button onClick={handleSubmitReview} disabled={!rating || createReview.isPending}
                    className="flex-1 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 cursor-pointer">
                    {createReview.isPending ? 'Enviando...' : 'Enviar calificación'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Resumen tab ──────────────────────────────────────────────────────────────

interface ResumenTabProps {
  contract: NonNullable<ReturnType<typeof useContract>['data']>;
  myReview?: { id: string; rating: number; comment?: string } | null;
  isCompleted?: boolean;
  otherName?: string;
  onRate?: () => void;
}

export function ResumenTab({ contract, myReview, isCompleted, otherName, onRate }: ResumenTabProps) {
  const total = contract.milestones.reduce((s, m) => s + Number(m.amount), 0);
  const paid = contract.milestones.filter((m) => m.status === 'PAID').reduce((s, m) => s + Number(m.amount), 0);
  const pct = total > 0 ? (paid / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Progreso de pagos</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Liberado</span>
          <span className="font-semibold text-gray-800">S/ {paid.toLocaleString()} / S/ {total.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <motion.div className="bg-linear-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {contract.milestones.filter((m) => m.status === 'PAID').length} de {contract.milestones.length} milestones pagados
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: `S/ ${total.toLocaleString()}`, color: 'text-gray-800' },
          { label: 'Pagado', value: `S/ ${paid.toLocaleString()}`, color: 'text-emerald-700' },
          { label: 'Pendiente', value: `S/ ${(total - paid).toLocaleString()}`, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Milestones</p>
        <div className="space-y-2">
          {contract.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1">
              <MilestoneStatusIcon status={m.status} size={13} />
              <span className="flex-1 text-sm text-gray-700 truncate">{m.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
              <span className="text-xs font-semibold text-gray-600 shrink-0 whitespace-nowrap">S/ {Number(m.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Detalles del contrato</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Proyecto</span>
            <span className="font-medium text-gray-800 truncate max-w-[60%] text-right">{contract.project?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Comisión plataforma</span>
            <span className="font-medium text-gray-800">{Number(contract.platformFee)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Creado</span>
            <span className="font-medium text-gray-800">{new Date(contract.createdAt).toLocaleDateString('es-PE')}</span>
          </div>
        </div>
      </div>

      {isCompleted && (
        myReview ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Tu calificación</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} className={`${s <= myReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
              ))}
              <span className="ml-2 text-sm font-semibold text-gray-700">{myReview.rating}/5</span>
            </div>
            {myReview.comment && (
              <p className="text-sm text-gray-600 italic">"{myReview.comment}"</p>
            )}
          </div>
        ) : (
          <button onClick={onRate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm font-medium cursor-pointer">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            Califica a {otherName ?? 'la otra parte'}
          </button>
        )
      )}
    </div>
  );
}
