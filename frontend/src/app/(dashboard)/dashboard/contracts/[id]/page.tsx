'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Circle, Clock, AlertCircle, ExternalLink,
  Send, ThumbsUp, MessageSquare, ListChecks, LayoutDashboard,
  Rocket, RotateCcw, DollarSign, PartyPopper, Building2, User,
  Star, ChevronRight, X, Edit3,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  useContract, useContractMessages, useSendMessage,
  useProposeAction, useRespondToProposal,
} from '@/hooks/use-contracts';
import type { Milestone, MilestoneStatus, ContractMessage, MessageProposalStatus } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'milestones' | 'resumen';

const TAB_ORDER: Tab[] = ['chat', 'milestones', 'resumen'];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', SUBMITTED: 'Entregado',
  REVISION_REQUESTED: 'Revisión', APPROVED: 'Aprobado', PAID: 'Pagado',
};
const STATUS_COLORS: Record<MilestoneStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700', REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700', PAID: 'bg-emerald-100 text-emerald-700',
};
function MilestoneStatusIcon({ status, size = 16 }: { status: MilestoneStatus; size?: number }) {
  switch (status) {
    case 'PAID': case 'APPROVED': return <CheckCircle size={size} className="text-emerald-600" />;
    case 'SUBMITTED': return <Clock size={size} className="text-yellow-600" />;
    case 'REVISION_REQUESTED': return <AlertCircle size={size} className="text-orange-600" />;
    case 'IN_PROGRESS': return <Clock size={size} className="text-blue-500" />;
    default: return <Circle size={size} className="text-gray-300" />;
  }
}

// ─── Event icon / colors ──────────────────────────────────────────────────────

function EventIcon({ action }: { action?: string }) {
  switch (action) {
    case 'MILESTONE_STARTED':    return <Rocket size={14} className="text-blue-500" />;
    case 'MILESTONE_SUBMITTED':  return <Send size={14} className="text-yellow-600" />;
    case 'MILESTONE_REVISION_REQUESTED': return <RotateCcw size={14} className="text-orange-500" />;
    case 'MILESTONE_PAID':       return <DollarSign size={14} className="text-emerald-600" />;
    case 'CONTRACT_COMPLETED':   return <PartyPopper size={14} className="text-purple-500" />;
    default:                     return <CheckCircle size={14} className="text-gray-400" />;
  }
}
const EVENT_COLORS: Record<string, string> = {
  MILESTONE_STARTED: 'bg-blue-50 border-blue-200 text-blue-800',
  MILESTONE_SUBMITTED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-50 border-orange-200 text-orange-800',
  MILESTONE_PAID: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  CONTRACT_COMPLETED: 'bg-purple-50 border-purple-200 text-purple-800',
};

// ─── Proposal action labels ───────────────────────────────────────────────────

const PROPOSAL_LABELS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  PROPOSE_START:    { icon: <Rocket size={14} />,    label: 'Propone iniciar',   color: 'text-blue-700' },
  PROPOSE_SUBMIT:   { icon: <Send size={14} />,      label: 'Propone entregar',  color: 'text-yellow-700' },
  PROPOSE_REVISION: { icon: <RotateCcw size={14} />, label: 'Pide revisión',     color: 'text-orange-700' },
  PROPOSE_APPROVE:  { icon: <ThumbsUp size={14} />,  label: 'Propone aprobar',   color: 'text-green-700' },
};

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({
  name, role, logoUrl, avatarUrl, rating, extra,
}: {
  name: string; role: 'company' | 'developer'; logoUrl?: string | null; avatarUrl?: string | null;
  rating?: number; extra?: string | null;
}) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        role === 'company' ? 'bg-blue-100' : 'bg-violet-100'
      }`}>
        {logoUrl || avatarUrl ? (
          <img src={logoUrl ?? avatarUrl ?? ''} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : role === 'company' ? (
          <Building2 size={18} className="text-blue-600" />
        ) : (
          <User size={18} className="text-violet-600" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-400">{role === 'company' ? 'Empresa' : 'Developer'}</p>
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
          </div>
        )}
        {extra && <p className="text-xs text-gray-400 truncate">{extra}</p>}
      </div>
    </div>
  );
}

// ─── Propose modal ────────────────────────────────────────────────────────────

function ProposeModal({
  milestone, contractId, action, onClose,
}: {
  milestone: Milestone; contractId: string;
  action: 'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE';
  onClose: () => void;
}) {
  const propose = useProposeAction(contractId);
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [reason, setReason] = useState('');

  const titles = {
    PROPOSE_START: 'Proponer inicio de milestone',
    PROPOSE_SUBMIT: 'Proponer entrega de milestone',
    PROPOSE_REVISION: 'Proponer revisión',
    PROPOSE_APPROVE: 'Proponer aprobación y pago',
  };
  const confirmLabels = {
    PROPOSE_START: 'Enviar propuesta de inicio',
    PROPOSE_SUBMIT: 'Enviar propuesta de entrega',
    PROPOSE_REVISION: 'Enviar propuesta de revisión',
    PROPOSE_APPROVE: 'Enviar propuesta de aprobación',
  };

  const handleSend = () => {
    propose.mutate(
      { milestoneId: milestone.id, action, deliveryNote: note || undefined, deliveryLink: link || undefined, reason: reason || undefined },
      { onSuccess: onClose },
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
            <h2 className="text-base font-semibold text-gray-900">{titles[action]}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{milestone.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
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
          {(action === 'PROPOSE_START' || action === 'PROPOSE_APPROVE') && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              {action === 'PROPOSE_START'
                ? 'Se enviará una propuesta de inicio al cliente. Podrá aceptar, rechazar o hacerte una contraoferta.'
                : 'Se enviará una propuesta de aprobación al developer. Podrá confirmar o responder.'}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={propose.isPending}
              className="flex-1 px-4 py-2.5 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 font-medium"
            >
              {propose.isPending ? 'Enviando...' : confirmLabels[action]}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Counter modal ────────────────────────────────────────────────────────────

function CounterModal({
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-gray-500" /></button>
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
          rows={3} placeholder="Describe tu contraoferta o los cambios que propones..."
          value={counter} onChange={(e) => setCounter(e.target.value)} autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => respond.mutate({ messageId, response: 'counter', counter }, { onSuccess: onClose })}
            disabled={!counter.trim() || respond.isPending}
            className="flex-1 px-4 py-2.5 text-sm bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-60 font-medium"
          >
            {respond.isPending ? 'Enviando...' : 'Enviar contraoferta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Proposal card (in chat) ──────────────────────────────────────────────────

function ProposalCard({
  msg, contractId, currentUserId,
}: { msg: ContractMessage; contractId: string; currentUserId?: string }) {
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
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${info.color}`}>
              {info.icon}
              <span>{info.label}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[status] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusLabel[status] ?? status}
            </span>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{meta?.milestoneTitle}</p>
            {meta?.deliveryNote && (
              <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Nota:</span> {meta.deliveryNote}</p>
            )}
            {meta?.deliveryLink && (
              <a href={meta.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1">
                <ExternalLink size={10} />Ver entregable
              </a>
            )}
            {meta?.reason && (
              <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Motivo:</span> {meta.reason}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-2">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              {' · '}por {msg.sender.company?.name ?? msg.sender.developer?.name}
            </p>
          </div>

          {/* Actions — only show to the OTHER party and only if PENDING */}
          {!isOwn && status === 'PENDING' && (
            <div className="px-4 pb-3 flex gap-2">
              <button
                onClick={() => respond.mutate({ messageId: msg.id, response: 'accept' })}
                disabled={respond.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 py-2 text-xs font-semibold bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <Edit3 size={11} className="inline mr-1" />Contraoferta
              </button>
              <button
                onClick={() => respond.mutate({ messageId: msg.id, response: 'reject' })}
                disabled={respond.isPending}
                className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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

// ─── Chat message ─────────────────────────────────────────────────────────────

function ChatMessage({ msg, contractId, currentUserId }: { msg: ContractMessage; contractId: string; currentUserId?: string }) {
  if (msg.type === 'PROPOSAL') {
    return <ProposalCard msg={msg} contractId={contractId} currentUserId={currentUserId} />;
  }

  if (msg.type === 'EVENT') {
    const action = msg.metadata?.action ?? '';
    const colorClass = EVENT_COLORS[action] ?? 'bg-gray-50 border-gray-200 text-gray-700';
    return (
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
        <div className={`flex items-start gap-2 px-4 py-2.5 rounded-xl border text-xs max-w-xs w-full ${colorClass}`}>
          <EventIcon action={action} />
          <div className="min-w-0">
            <p className="font-medium leading-snug">{msg.content}</p>
            {msg.metadata?.deliveryLink && (
              <a href={msg.metadata.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:underline mt-0.5">
                <ExternalLink size={10} />Ver entregable
              </a>
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
  const name = msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 px-1">
          {!isOwn && <span className="text-xs font-medium text-gray-500">{name}</span>}
          <span className="text-[10px] text-gray-400">
            {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <span className="text-xs font-medium text-gray-500">{name}</span>}
        </div>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isOwn ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab: Chat ────────────────────────────────────────────────────────────────

function ChatTab({ contractId }: { contractId: string }) {
  const { user } = useAuthStore();
  const { data: messages = [], isLoading } = useContractMessages(contractId);
  const sendMessage = useSendMessage(contractId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || sendMessage.isPending) return;
    sendMessage.mutate(text, { onSuccess: () => setText('') });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '500px' }}>
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
        {isLoading && [...Array(4)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className="h-9 w-44 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        ))}
        {!isLoading && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-12">
            <MessageSquare size={30} className="text-gray-200" />
            <p className="text-sm text-gray-400">No hay mensajes aún.</p>
            <p className="text-xs text-gray-300">Las propuestas y eventos del contrato aparecerán aquí.</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} contractId={contractId} currentUserId={user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-100 p-3 flex gap-2 items-end bg-white">
        <textarea
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[40px] max-h-24"
          rows={1} placeholder="Escribe un mensaje... (Enter para enviar)"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button
          onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}
          className="shrink-0 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Milestones ──────────────────────────────────────────────────────────

function MilestoneCard({
  milestone, contractId, isCompany,
}: { milestone: Milestone; contractId: string; isCompany: boolean }) {
  const propose = useProposeAction(contractId);
  const [modal, setModal] = useState<'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE' | null>(null);

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <MilestoneStatusIcon status={milestone.status} />
            <span className="font-medium text-gray-900">{milestone.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[milestone.status]}`}>
              {STATUS_LABELS[milestone.status]}
            </span>
            <span className="text-sm font-semibold text-gray-700">S/ {Number(milestone.amount).toLocaleString()}</span>
          </div>
        </div>

        {milestone.description && <p className="text-sm text-gray-500 mb-3">{milestone.description}</p>}

        {['SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'PAID'].includes(milestone.status) &&
          (milestone.deliveryNote || milestone.deliveryLink) && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              {milestone.deliveryNote && <p className="text-gray-700 mb-1"><span className="font-medium">Nota:</span> {milestone.deliveryNote}</p>}
              {milestone.deliveryLink && (
                <a href={milestone.deliveryLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                  <ExternalLink size={12} />{milestone.deliveryLink}
                </a>
              )}
            </div>
          )}

        {/* Developer actions */}
        {!isCompany && (
          <div className="flex gap-2 flex-wrap">
            {milestone.status === 'PENDING' && (
              <button onClick={() => setModal('PROPOSE_START')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Rocket size={13} />Proponer inicio
              </button>
            )}
            {(milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') && (
              <button onClick={() => setModal('PROPOSE_SUBMIT')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Send size={13} />
                {milestone.status === 'REVISION_REQUESTED' ? 'Proponer re-entrega' : 'Proponer entrega'}
              </button>
            )}
          </div>
        )}

        {/* Company actions */}
        {isCompany && (
          <div className="flex gap-2 flex-wrap">
            {milestone.status === 'SUBMITTED' && (
              <>
                <button onClick={() => setModal('PROPOSE_APPROVE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <ThumbsUp size={13} />Proponer aprobación
                </button>
                <button onClick={() => setModal('PROPOSE_REVISION')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
                  <RotateCcw size={13} />Pedir revisión
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modal && (
          <ProposeModal milestone={milestone} contractId={contractId} action={modal} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function MilestonesTab({ milestones, contractId, isCompany }: { milestones: Milestone[]; contractId: string; isCompany: boolean }) {
  return (
    <div className="space-y-3">
      {milestones.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">Este contrato no tiene milestones definidos.</p>
        </div>
      )}
      {milestones.map((m) => <MilestoneCard key={m.id} milestone={m} contractId={contractId} isCompany={isCompany} />)}
    </div>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function ResumenTab({ contract }: { contract: NonNullable<ReturnType<typeof useContract>['data']> }) {
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
          <motion.div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full"
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
              <span className="text-xs font-semibold text-gray-600 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
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
    </div>
  );
}

// ─── Contract status helpers ──────────────────────────────────────────────────

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', COMPLETED: 'Completado', DISPUTED: 'En disputa', CANCELLED: 'Cancelado',
};
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700', COMPLETED: 'bg-green-50 text-green-700',
  DISPUTED: 'bg-red-50 text-red-700', CANCELLED: 'bg-gray-100 text-gray-600',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat',       label: 'Chat',       icon: <MessageSquare size={14} /> },
  { id: 'milestones', label: 'Milestones', icon: <ListChecks size={14} /> },
  { id: 'resumen',    label: 'Resumen',    icon: <LayoutDashboard size={14} /> },
];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: contract, isLoading, error } = useContract(id);
  const [tab, setTab] = useState<Tab>('chat');
  const [direction, setDirection] = useState(0);

  const isCompany = user?.role === 'COMPANY';

  const switchTab = (next: Tab) => {
    const from = TAB_ORDER.indexOf(tab);
    const to = TAB_ORDER.indexOf(next);
    setDirection(to > from ? 1 : -1);
    setTab(next);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
        <div className="h-12 bg-white rounded-xl border border-gray-100 animate-pulse" />
        {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No se pudo cargar el contrato.</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-primary-600 hover:underline">Volver</button>
      </div>
    );
  }

  const project = contract.project as typeof contract.project & {
    company?: { name?: string; logoUrl?: string | null; industry?: string | null };
    proposals?: Array<{
      developer?: { name: string; avatarUrl?: string | null; rating?: number; skills?: string[] };
    }>;
  };
  const companyInfo = project?.company;
  const devInfo = project?.proposals?.[0]?.developer;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-gray-900 text-lg truncate">{project?.title ?? 'Contrato'}</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${CONTRACT_STATUS_COLORS[contract.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
            </span>
          </div>
        </div>
      </div>

      {/* Party cards */}
      <div className="flex gap-3 mb-4">
        {companyInfo && (
          <ProfileCard
            name={companyInfo.name ?? 'Empresa'}
            role="company"
            logoUrl={companyInfo.logoUrl}
            extra={companyInfo.industry}
          />
        )}
        {devInfo && (
          <ProfileCard
            name={devInfo.name}
            role="developer"
            avatarUrl={devInfo.avatarUrl}
            rating={devInfo.rating}
            extra={devInfo.skills?.slice(0, 2).join(', ')}
          />
        )}
        {!devInfo && (
          <div className="flex-1 bg-white rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-center">
            <p className="text-xs text-gray-400">Developer pendiente</p>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex bg-white rounded-xl border border-gray-100 p-1 mb-4 gap-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => switchTab(t.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === t.id && (
              <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-primary-50 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={tab} custom={direction}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}>
          {tab === 'chat' && <ChatTab contractId={contract.id} />}
          {tab === 'milestones' && <MilestonesTab milestones={contract.milestones} contractId={contract.id} isCompany={isCompany} />}
          {tab === 'resumen' && <ResumenTab contract={contract} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
