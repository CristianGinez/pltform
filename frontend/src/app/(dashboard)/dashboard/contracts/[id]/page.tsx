'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Circle, Clock, AlertCircle, ExternalLink,
  Send, ThumbsUp, MessageSquare, ListChecks, LayoutDashboard,
  Rocket, RotateCcw, DollarSign, PartyPopper, Building2, User,
  Star, ChevronRight, X, Edit3, Activity, Eye, Lock, Zap, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  useContract, useContractMessages, useSendMessage,
  useProposeAction, useRespondToProposal,
  useSendProgressUpdate, useMarkReadyForTesting,
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
    case 'PROGRESS_UPDATE':      return <Activity size={14} className="text-blue-400" />;
    case 'READY_FOR_TESTING':    return <Eye size={14} className="text-purple-500" />;
    default:                     return <CheckCircle size={14} className="text-gray-400" />;
  }
}
const EVENT_COLORS: Record<string, string> = {
  MILESTONE_STARTED: 'bg-blue-50 border-blue-200 text-blue-800',
  MILESTONE_SUBMITTED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-50 border-orange-200 text-orange-800',
  MILESTONE_PAID: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  CONTRACT_COMPLETED: 'bg-purple-50 border-purple-200 text-purple-800',
  PROGRESS_UPDATE: 'bg-sky-50 border-sky-200 text-sky-800',
  READY_FOR_TESTING: 'bg-purple-50 border-purple-200 text-purple-800',
};

// ─── Proposal action labels ───────────────────────────────────────────────────

const PROPOSAL_LABELS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  PROPOSE_START:    { icon: <Rocket size={14} />,    label: 'Propone iniciar',   color: 'text-blue-700' },
  PROPOSE_SUBMIT:   { icon: <Send size={14} />,      label: 'Propone entregar',  color: 'text-yellow-700' },
  PROPOSE_REVISION: { icon: <RotateCcw size={14} />, label: 'Pide revisión',     color: 'text-orange-700' },
  PROPOSE_APPROVE:  { icon: <ThumbsUp size={14} />,  label: 'Propone aprobar',   color: 'text-green-700' },
};

// ─── Profile card (side column, vertical) ────────────────────────────────────

function ProfileCard({
  name, role, logoUrl, avatarUrl, rating, extra, skills, isCurrentUser,
}: {
  name: string; role: 'company' | 'developer'; logoUrl?: string | null; avatarUrl?: string | null;
  rating?: number; extra?: string | null; skills?: string[]; isCurrentUser?: boolean;
}) {
  const img = logoUrl ?? avatarUrl;
  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${
      isCurrentUser ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-100'
    }`}>
      {/* Avatar */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
        role === 'company' ? 'bg-blue-100' : 'bg-violet-100'
      }`}>
        {img ? (
          <img src={img} alt={name} className="w-14 h-14 rounded-full object-cover" />
        ) : role === 'company' ? (
          <Building2 size={22} className="text-blue-600" />
        ) : (
          <User size={22} className="text-violet-600" />
        )}
      </div>

      {/* Name + role */}
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
          role === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
        }`}>
          {role === 'company' ? 'Empresa' : 'Developer'}
        </span>
        {isCurrentUser && (
          <p className="text-[10px] text-primary-500 mt-0.5">Tú</p>
        )}
      </div>

      {/* Rating */}
      {rating !== undefined && rating > 0 && (
        <div className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
        </div>
      )}

      {/* Extra info */}
      {extra && <p className="text-[11px] text-gray-400 leading-tight">{extra}</p>}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1">
          {skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyProfileCard({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]">
      <User size={20} className="text-gray-300" />
      <p className="text-[11px] text-gray-400">{label}</p>
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
  const isCounter = msg.metadata?.isCounter === true;

  // Counter-offer: styled card
  if (isCounter) {
    return (
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
        </div>
      </motion.div>
    );
  }

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

const STEP_COLORS: Record<MilestoneStatus, { leftBorder: string; bg: string }> = {
  PENDING:            { leftBorder: 'border-l-gray-200',   bg: 'bg-white' },
  IN_PROGRESS:        { leftBorder: 'border-l-blue-400',   bg: 'bg-blue-50/40' },
  SUBMITTED:          { leftBorder: 'border-l-yellow-400', bg: 'bg-yellow-50/40' },
  REVISION_REQUESTED: { leftBorder: 'border-l-orange-400', bg: 'bg-orange-50/40' },
  APPROVED:           { leftBorder: 'border-l-green-400',  bg: 'bg-green-50/30' },
  PAID:               { leftBorder: 'border-l-emerald-400',bg: 'bg-emerald-50/30' },
};

function ProgressUpdateModal({
  milestone, contractId, onClose,
}: { milestone: Milestone; contractId: string; onClose: () => void }) {
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={15} className="text-gray-400" /></button>
        </div>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          rows={3} autoFocus placeholder="¿En qué estás trabajando? ¿Qué avances tienes? ¿Algún bloqueo?"
          value={note} onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => sendUpdate.mutate({ milestoneId: milestone.id, note }, { onSuccess: onClose })}
            disabled={!note.trim() || sendUpdate.isPending}
            className="flex-1 py-2 text-sm font-semibold bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-60 transition-colors"
          >
            {sendUpdate.isPending ? 'Enviando...' : 'Enviar actualización'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MilestoneStep({
  milestone, index, total, contractId, isCompany, locked,
}: { milestone: Milestone; index: number; total: number; contractId: string; isCompany: boolean; locked: boolean }) {
  const [modal, setModal] = useState<'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE' | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const readyForTesting = useMarkReadyForTesting(contractId);

  const colors = STEP_COLORS[milestone.status];
  const isDone = milestone.status === 'APPROVED' || milestone.status === 'PAID';
  const isActive = ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED'].includes(milestone.status);

  // Actions available to developer based on status
  const devActions: { label: string; icon: React.ReactNode; onClick: () => void; style: string }[] = [];
  if (!isCompany && !locked) {
    if (milestone.status === 'PENDING') {
      devActions.push({
        label: 'Proponer inicio',
        icon: <Rocket size={12} />,
        onClick: () => setModal('PROPOSE_START'),
        style: 'bg-blue-600 text-white hover:bg-blue-700',
      });
    }
    if (milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') {
      devActions.push(
        {
          label: 'Enviar actualización',
          icon: <Activity size={12} />,
          onClick: () => setShowProgressModal(true),
          style: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
        },
        {
          label: 'Listo para testing',
          icon: <Eye size={12} />,
          onClick: () => readyForTesting.mutate(milestone.id),
          style: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
        },
        {
          label: milestone.status === 'REVISION_REQUESTED' ? 'Proponer re-entrega' : 'Proponer entrega',
          icon: <Send size={12} />,
          onClick: () => setModal('PROPOSE_SUBMIT'),
          style: 'bg-primary-600 text-white hover:bg-primary-700',
        },
      );
    }
  }

  // Actions available to company
  const companyActions: { label: string; icon: React.ReactNode; onClick: () => void; style: string }[] = [];
  if (isCompany && milestone.status === 'SUBMITTED') {
    companyActions.push(
      {
        label: 'Proponer aprobación',
        icon: <ThumbsUp size={12} />,
        onClick: () => setModal('PROPOSE_APPROVE'),
        style: 'bg-green-600 text-white hover:bg-green-700',
      },
      {
        label: 'Pedir revisión',
        icon: <RotateCcw size={12} />,
        onClick: () => setModal('PROPOSE_REVISION'),
        style: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
      },
    );
  }

  const allActions = isCompany ? companyActions : devActions;

  return (
    <>
      <div className="flex gap-3">
        {/* Left: number bubble + connector */}
        <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 shrink-0 ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : isActive
              ? 'bg-white border-primary-500 text-primary-700 shadow-sm shadow-primary-100'
              : locked
              ? 'bg-gray-100 border-gray-200 text-gray-400'
              : 'bg-white border-gray-300 text-gray-500'
          }`}>
            {isDone ? <CheckCircle size={15} /> : locked ? <Lock size={11} /> : <span>{index + 1}</span>}
          </div>
          {index < total - 1 && (
            <div className={`w-0.5 flex-1 my-1 min-h-[16px] rounded-full ${isDone ? 'bg-emerald-300' : isActive ? 'bg-primary-200' : 'bg-gray-200'}`} />
          )}
        </div>

        {/* Right: card */}
        <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06 }}
          className={`flex-1 mb-3 rounded-xl border border-gray-100 border-l-4 p-4 ${colors.bg} ${colors.leftBorder} ${locked ? 'opacity-60' : ''}`}>

          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`font-semibold text-sm ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {milestone.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[milestone.status]}`}>
                {STATUS_LABELS[milestone.status]}
              </span>
              <span className="text-xs font-bold text-gray-600">S/ {Number(milestone.amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          {milestone.description && (
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{milestone.description}</p>
          )}

          {/* Dates row */}
          {(milestone.dueDate || milestone.startedAt || milestone.submittedAt) && (
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 mb-2">
              {milestone.dueDate && <span>Límite: {new Date(milestone.dueDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
              {milestone.startedAt && <span className="text-blue-500">Iniciado: {new Date(milestone.startedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
              {milestone.submittedAt && <span className="text-yellow-600">Entregado: {new Date(milestone.submittedAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>}
            </div>
          )}

          {/* Delivery info */}
          {['SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'PAID'].includes(milestone.status) &&
            (milestone.deliveryNote || milestone.deliveryLink) && (
              <div className="bg-white/80 rounded-lg p-3 mb-3 text-xs border border-white/60">
                {milestone.deliveryNote && (
                  <p className="text-gray-700 mb-1"><span className="font-medium">Nota de entrega:</span> {milestone.deliveryNote}</p>
                )}
                {milestone.deliveryLink && (
                  <a href={milestone.deliveryLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:underline">
                    <ExternalLink size={10} />Ver entregable
                  </a>
                )}
              </div>
            )}

          {/* Locked message */}
          {locked && !isCompany && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Lock size={10} />Completa el milestone anterior para desbloquear
            </p>
          )}

          {/* Actions */}
          {allActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {allActions.map((a) => (
                <button key={a.label} onClick={a.onClick}
                  disabled={readyForTesting.isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-60 ${a.style}`}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {modal && (
          <ProposeModal milestone={milestone} contractId={contractId} action={modal} onClose={() => setModal(null)} />
        )}
        {showProgressModal && (
          <ProgressUpdateModal milestone={milestone} contractId={contractId} onClose={() => setShowProgressModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function MilestonesTab({ milestones, contractId, isCompany }: { milestones: Milestone[]; contractId: string; isCompany: boolean }) {
  const done = milestones.filter((m) => m.status === 'PAID').length;
  const pct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;

  // Determine which milestones are "locked" for dev
  // A milestone is locked if any previous milestone is not PAID
  const isLocked = (index: number) => {
    if (isCompany) return false; // company sees everything
    for (let i = 0; i < index; i++) {
      if (milestones[i].status !== 'PAID') return true;
    }
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Progress summary */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Ruta del proyecto</span>
            <span className="text-xs text-gray-400">{done}/{milestones.length} completados · {pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-primary-400 to-emerald-500 h-2 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {/* Status chips */}
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
        </div>
      )}

      {/* Roadmap */}
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
          />
        ))}
      </div>
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
    <div className="max-w-5xl mx-auto px-2">
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

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-4 items-start">

        {/* Left: Company card */}
        <div className="hidden lg:block sticky top-4">
          {companyInfo ? (
            <ProfileCard
              name={companyInfo.name ?? 'Empresa'}
              role="company"
              logoUrl={companyInfo.logoUrl}
              extra={companyInfo.industry}
              isCurrentUser={isCompany}
            />
          ) : (
            <EmptyProfileCard label="Empresa" />
          )}
        </div>

        {/* Center: Tab bar + content */}
        <div>
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

        {/* Right: Developer card */}
        <div className="hidden lg:block sticky top-4">
          {devInfo ? (
            <ProfileCard
              name={devInfo.name}
              role="developer"
              avatarUrl={devInfo.avatarUrl}
              rating={devInfo.rating}
              extra={devInfo.skills?.slice(0, 2).join(', ')}
              isCurrentUser={!isCompany}
            />
          ) : (
            <EmptyProfileCard label="Developer" />
          )}
        </div>

      </div>
    </div>
  );
}
