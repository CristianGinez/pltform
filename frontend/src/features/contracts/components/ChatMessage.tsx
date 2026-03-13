'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronRight, Edit3 } from 'lucide-react';
import { useRespondToProposal, useSendMessage } from '@/hooks/use-contracts';
import type { ContractMessage, MessageProposalStatus } from '@/types';
import { PROPOSAL_LABELS, EVENT_COLORS } from '../constants';
import { EventIcon } from '../utils';
import { CounterModal } from './CounterModal';

// ─── Proposal card ────────────────────────────────────────────────────────────

function ProposalCard({
  msg, contractId, currentUserId, onGoToMilestones,
}: { msg: ContractMessage; contractId: string; currentUserId?: string; onGoToMilestones?: () => void }) {
  const respond = useRespondToProposal(contractId);
  const [showCounter, setShowCounter] = useState(false);
  const meta = msg.metadata;
  const action = meta?.action ?? '';
  const status: MessageProposalStatus = (meta?.proposalStatus ?? 'PENDING') as MessageProposalStatus;
  const isOwn = msg.sender.id === currentUserId;
  const info = PROPOSAL_LABELS[action] ?? { icon: null, label: action, color: 'text-gray-700' };

  const statusBadge: Record<MessageProposalStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    COUNTERED: 'bg-orange-100 text-orange-700',
  };
  const statusLabel: Record<MessageProposalStatus, string> = {
    PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', COUNTERED: 'Contraoferta enviada',
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${info.color}`}>
              {info.icon}
              <span>{info.label}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[status] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusLabel[status] ?? status}
            </span>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 [overflow-wrap:anywhere] min-w-0 flex-1">{meta?.milestoneTitle}</p>
              {onGoToMilestones && (
                <button onClick={onGoToMilestones}
                  className="text-xs text-primary-600 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer">
                  Ver milestone <ChevronRight size={11} />
                </button>
              )}
            </div>
            {meta?.deliveryNote && (
              <p className="text-xs text-gray-500 mt-1 [overflow-wrap:anywhere]"><span className="font-medium">Nota:</span> {meta.deliveryNote}</p>
            )}
            {meta?.deliveryLink && (
              <a href={meta.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1 break-all">
                <ExternalLink size={10} />Ver entregable
              </a>
            )}
            {meta?.reason && (
              <p className="text-xs text-gray-500 mt-1 [overflow-wrap:anywhere]"><span className="font-medium">Motivo:</span> {meta.reason}</p>
            )}
            {action === 'PROPOSE_MILESTONE_PLAN' && meta?.milestones && (
              <div className="mt-2 space-y-1">
                {(meta.milestones as Array<{title: string; amount: number; description?: string}>).map((m, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs text-gray-600 py-0.5">
                    <span className="[overflow-wrap:anywhere] min-w-0 flex-1">{i+1}. {m.title}</span>
                    <span className="font-medium text-gray-700 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-semibold text-gray-800 pt-1 border-t border-gray-100 mt-1">
                  <span>Total</span>
                  <span>S/ {(meta.milestones as Array<{amount: number}>).reduce((s, m) => s + Number(m.amount), 0).toLocaleString()}</span>
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2 truncate">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              {' · '}por {msg.sender.company?.name ?? msg.sender.developer?.name}
            </p>
          </div>

          {!isOwn && status === 'PENDING' && (
            <div className="px-4 pb-3 flex gap-2">
              <button
                onClick={() => respond.mutate(
                  { messageId: msg.id, response: 'accept' },
                  {
                    onSuccess: () => {
                      if ((action === 'PROPOSE_SUBMIT' || action === 'PROPOSE_MILESTONE_PLAN') && onGoToMilestones) {
                        onGoToMilestones();
                      }
                    },
                  }
                )}
                disabled={respond.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                Aceptar
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 py-2 text-xs font-semibold bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors cursor-pointer"
              >
                <Edit3 size={11} className="inline mr-1" />Contraoferta
              </button>
              <button
                onClick={() => respond.mutate({ messageId: msg.id, response: 'reject' })}
                disabled={respond.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                Rechazar
              </button>
            </div>
          )}

          {isOwn && status === 'PENDING' && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-400 text-center animate-pulse">Esperando respuesta...</p>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCounter && (
          <CounterModal messageId={msg.id} contractId={contractId} onClose={() => setShowCounter(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Counter-offer card ───────────────────────────────────────────────────────

function CounterOfferCard({ msg, currentUserId, contractId }: { msg: ContractMessage; currentUserId?: string; contractId: string }) {
  const [responded, setResponded] = useState<'accepted' | 'rejected' | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const send = useSendMessage(contractId);
  const name = msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';
  const isOwn = msg.sender.id === currentUserId;

  const handleAccept = () => {
    send.mutate('✓ Contraoferta aceptada', { onSuccess: () => setResponded('accepted') });
  };
  const handleReject = () => {
    send.mutate('✗ Contraoferta rechazada', { onSuccess: () => setResponded('rejected') });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
        <div className="w-full max-w-sm bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-orange-100 border-b border-orange-200 flex items-center gap-2">
            <Edit3 size={13} className="text-orange-600" />
            <span className="text-xs font-semibold text-orange-700">Contraoferta</span>
            {msg.metadata?.milestoneTitle && (
              <span className="text-xs text-orange-500 truncate">· {msg.metadata.milestoneTitle}</span>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            <p className="text-[10px] text-gray-400 mt-2">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{name}
            </p>
          </div>
          {!isOwn && !responded && (
            <div className="px-4 pb-3 flex gap-2">
              <button onClick={handleAccept} disabled={send.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 cursor-pointer">
                Aceptar
              </button>
              <button onClick={() => setShowCounter(true)}
                className="flex-1 py-2 text-xs font-semibold bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 cursor-pointer">
                <Edit3 size={11} className="inline mr-1" />Contra
              </button>
              <button onClick={handleReject} disabled={send.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer">
                Rechazar
              </button>
            </div>
          )}
          {responded && (
            <div className="px-4 pb-3">
              <p className={`text-xs text-center font-medium ${responded === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                {responded === 'accepted' ? '✓ Contraoferta aceptada' : '✗ Contraoferta rechazada'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {showCounter && (
          <CounterModal messageId={msg.id} contractId={contractId} onClose={() => setShowCounter(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────

export function ChatMessage({ msg, contractId, currentUserId, onGoToMilestones }: {
  msg: ContractMessage;
  contractId: string;
  currentUserId?: string;
  onGoToMilestones?: () => void;
}) {
  if (msg.type === 'PROPOSAL') {
    return <ProposalCard msg={msg} contractId={contractId} currentUserId={currentUserId} onGoToMilestones={onGoToMilestones} />;
  }

  if (msg.type === 'EVENT') {
    const action = msg.metadata?.action ?? '';
    const colorClass = EVENT_COLORS[action] ?? 'bg-gray-50 border-gray-200 text-gray-700';
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
        <div className={`flex items-start gap-2 px-4 py-2.5 rounded-xl border text-xs max-w-xs w-full ${colorClass}`}>
          <EventIcon action={action} />
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug [overflow-wrap:anywhere]">{msg.content}</p>
            {msg.metadata?.deliveryLink && (
              <a href={msg.metadata.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:underline mt-0.5">
                <ExternalLink size={10} />Ver entregable
              </a>
            )}
            {action === 'DISPUTE_RESOLVED' && (msg.metadata as { adminComment?: string })?.adminComment && (
              <p className="mt-1 opacity-80">
                Admin: &ldquo;{(msg.metadata as { adminComment?: string }).adminComment}&rdquo;
              </p>
            )}
            <p className="text-[10px] opacity-60 mt-0.5">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const isOwn = msg.sender.id === currentUserId;
  const isCounter = msg.metadata?.isCounter === true;

  if (isCounter) {
    return <CounterOfferCard msg={msg} currentUserId={currentUserId} contractId={contractId} />;
  }

  const name = msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] min-w-0 flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 px-1 min-w-0">
          {!isOwn && <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">{name}</span>}
          <span className="text-[10px] text-gray-400 shrink-0">
            {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">{name}</span>}
        </div>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${
          isOwn ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}
