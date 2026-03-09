'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  ExternalLink,
  Play,
  Send,
  ThumbsUp,
  MessageSquare,
  ListChecks,
  LayoutDashboard,
  Rocket,
  RotateCcw,
  DollarSign,
  PartyPopper,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  useContract,
  useStartMilestone,
  useSubmitMilestone,
  useApproveMilestone,
  useRequestRevision,
  useContractMessages,
  useSendMessage,
} from '@/hooks/use-contracts';
import type { Milestone, MilestoneStatus, ContractMessage } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'chat' | 'milestones' | 'resumen';

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  SUBMITTED: 'Entregado',
  REVISION_REQUESTED: 'Revisión solicitada',
  APPROVED: 'Aprobado',
  PAID: 'Pagado',
};

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

function StatusIcon({ status, size = 16 }: { status: MilestoneStatus; size?: number }) {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
      return <CheckCircle size={size} className="text-emerald-600" />;
    case 'SUBMITTED':
      return <Clock size={size} className="text-yellow-600" />;
    case 'REVISION_REQUESTED':
      return <AlertCircle size={size} className="text-orange-600" />;
    case 'IN_PROGRESS':
      return <Clock size={size} className="text-blue-500" />;
    default:
      return <Circle size={size} className="text-gray-300" />;
  }
}

// ─── Event message icon ───────────────────────────────────────────────────────

function EventIcon({ action }: { action?: string }) {
  switch (action) {
    case 'MILESTONE_STARTED':    return <Rocket size={15} className="text-blue-500" />;
    case 'MILESTONE_SUBMITTED':  return <Send size={15} className="text-yellow-600" />;
    case 'MILESTONE_REVISION_REQUESTED': return <RotateCcw size={15} className="text-orange-500" />;
    case 'MILESTONE_PAID':       return <DollarSign size={15} className="text-emerald-600" />;
    case 'CONTRACT_COMPLETED':   return <PartyPopper size={15} className="text-purple-500" />;
    default:                     return <CheckCircle size={15} className="text-gray-400" />;
  }
}

const EVENT_BG: Record<string, string> = {
  MILESTONE_STARTED:            'bg-blue-50 border-blue-200',
  MILESTONE_SUBMITTED:          'bg-yellow-50 border-yellow-200',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-50 border-orange-200',
  MILESTONE_PAID:               'bg-emerald-50 border-emerald-200',
  CONTRACT_COMPLETED:           'bg-purple-50 border-purple-200',
};

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitModal({ milestone, contractId, onClose }: { milestone: Milestone; contractId: string; onClose: () => void }) {
  const [note, setNote] = useState(milestone.deliveryNote ?? '');
  const [link, setLink] = useState(milestone.deliveryLink ?? '');
  const submit = useSubmitMilestone();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Entregar milestone</h2>
        <p className="text-sm text-gray-500 mb-4">{milestone.title}</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nota de entrega</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Describe qué entregaste, qué fue implementado..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <label className="block text-sm font-medium text-gray-700 mb-1">Link al entregable</label>
        <input
          type="url"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="https://staging.vercel.app o https://github.com/..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button
            onClick={() => submit.mutate({ contractId, milestoneId: milestone.id, deliveryNote: note, deliveryLink: link }, { onSuccess: onClose })}
            disabled={submit.isPending}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {submit.isPending ? 'Enviando...' : 'Confirmar entrega'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Revision Modal ───────────────────────────────────────────────────────────

function RevisionModal({ milestone, contractId, onClose }: { milestone: Milestone; contractId: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const requestRevision = useRequestRevision();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Solicitar revisión</h2>
        <p className="text-sm text-gray-500 mb-4">{milestone.title}</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué necesita corregirse?</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
          placeholder="Describe el problema, qué falta o qué debe cambiar..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button
            onClick={() => requestRevision.mutate({ contractId, milestoneId: milestone.id, reason }, { onSuccess: onClose })}
            disabled={requestRevision.isPending}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60"
          >
            {requestRevision.isPending ? 'Enviando...' : 'Confirmar revisión'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Milestone Card ───────────────────────────────────────────────────────────

function MilestoneCard({ milestone, contractId, isCompany }: { milestone: Milestone; contractId: string; isCompany: boolean }) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const startMilestone = useStartMilestone();
  const approveMilestone = useApproveMilestone();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-5"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon status={milestone.status} />
            <span className="font-medium text-gray-900">{milestone.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
              {milestone.deliveryNote && (
                <p className="text-gray-700 mb-1"><span className="font-medium">Nota:</span> {milestone.deliveryNote}</p>
              )}
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
          <div className="flex gap-2 mt-1">
            {milestone.status === 'PENDING' && (
              <button
                onClick={() => startMilestone.mutate({ contractId, milestoneId: milestone.id })}
                disabled={startMilestone.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Play size={13} />Iniciar
              </button>
            )}
            {(milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Send size={13} />
                {milestone.status === 'REVISION_REQUESTED' ? 'Volver a entregar' : 'Entregar milestone'}
              </button>
            )}
          </div>
        )}

        {/* Company actions */}
        {isCompany && milestone.status === 'SUBMITTED' && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => approveMilestone.mutate({ contractId, milestoneId: milestone.id })}
              disabled={approveMilestone.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <ThumbsUp size={13} />Aprobar
            </button>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <MessageSquare size={13} />Pedir revisión
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showSubmitModal && <SubmitModal milestone={milestone} contractId={contractId} onClose={() => setShowSubmitModal(false)} />}
        {showRevisionModal && <RevisionModal milestone={milestone} contractId={contractId} onClose={() => setShowRevisionModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Chat message ─────────────────────────────────────────────────────────────

function ChatMessage({ msg, isOwn }: { msg: ContractMessage; isOwn: boolean }) {
  const senderName = msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';

  if (msg.type === 'EVENT') {
    const action = msg.metadata?.action ?? '';
    const bg = EVENT_BG[action] ?? 'bg-gray-50 border-gray-200';
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm max-w-sm w-full ${bg}`}>
          <span className="mt-0.5 shrink-0"><EventIcon action={action} /></span>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 leading-snug">{msg.content}</p>
            {msg.metadata?.deliveryLink && (
              <a href={msg.metadata.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1">
                <ExternalLink size={11} />Ver entregable
              </a>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 px-1">
          {!isOwn && <span className="text-xs font-medium text-gray-500">{senderName}</span>}
          <span className="text-xs text-gray-400">
            {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && <span className="text-xs font-medium text-gray-500">{senderName}</span>}
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
        {isLoading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            ))}
          </>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-12">
            <MessageSquare size={32} className="text-gray-200" />
            <p className="text-sm text-gray-400">No hay mensajes aún.</p>
            <p className="text-xs text-gray-300">Los eventos del contrato también aparecerán aquí.</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} isOwn={msg.sender.id === user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 flex gap-2 items-end bg-white">
        <textarea
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[40px] max-h-28"
          rows={1}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="shrink-0 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Milestones ──────────────────────────────────────────────────────────

function MilestonesTab({ milestones, contractId, isCompany }: { milestones: Milestone[]; contractId: string; isCompany: boolean }) {
  return (
    <div className="space-y-3">
      {milestones.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">Este contrato no tiene milestones definidos.</p>
        </div>
      )}
      {milestones.map((m) => (
        <MilestoneCard key={m.id} milestone={m} contractId={contractId} isCompany={isCompany} />
      ))}
    </div>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function ResumenTab({ contract }: { contract: ReturnType<typeof useContract>['data'] }) {
  if (!contract) return null;

  const totalAmount = contract.milestones.reduce((s, m) => s + Number(m.amount), 0);
  const paidAmount = contract.milestones.filter((m) => m.status === 'PAID').reduce((s, m) => s + Number(m.amount), 0);
  const paidCount = contract.milestones.filter((m) => m.status === 'PAID').length;
  const pct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const statusCounts = contract.milestones.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Payment progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Progreso de pagos</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Liberado</span>
          <span className="font-semibold text-gray-800">S/ {paidAmount.toLocaleString()} / S/ {totalAmount.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{paidCount} de {contract.milestones.length} milestones pagados</p>
      </div>

      {/* Milestone breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Estado de milestones</p>
        <div className="space-y-2">
          {contract.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <StatusIcon status={m.status} size={14} />
              <span className="flex-1 text-sm text-gray-700 truncate">{m.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                {STATUS_LABELS[m.status]}
              </span>
              <span className="text-xs font-semibold text-gray-600 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: `S/ ${totalAmount.toLocaleString()}`, color: 'text-gray-800' },
          { label: 'Pagado', value: `S/ ${paidAmount.toLocaleString()}`, color: 'text-emerald-700' },
          { label: 'Pendiente', value: `S/ ${(totalAmount - paidAmount).toLocaleString()}`, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contract info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Información del contrato</p>
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat',       label: 'Chat',       icon: <MessageSquare size={15} /> },
  { id: 'milestones', label: 'Milestones', icon: <ListChecks size={15} /> },
  { id: 'resumen',    label: 'Resumen',    icon: <LayoutDashboard size={15} /> },
];

// ─── Contract status ──────────────────────────────────────────────────────────

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', COMPLETED: 'Completado', DISPUTED: 'En disputa', CANCELLED: 'Cancelado',
};
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700', COMPLETED: 'bg-green-50 text-green-700',
  DISPUTED: 'bg-red-50 text-red-700', CANCELLED: 'bg-gray-100 text-gray-600',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: contract, isLoading, error } = useContract(id);
  const [tab, setTab] = useState<Tab>('chat');
  const [direction, setDirection] = useState(0);

  const isCompany = user?.role === 'COMPANY';
  const tabOrder: Tab[] = ['chat', 'milestones', 'resumen'];

  const switchTab = (next: Tab) => {
    const from = tabOrder.indexOf(tab);
    const to = tabOrder.indexOf(next);
    setDirection(to > from ? 1 : -1);
    setTab(next);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-white rounded-xl border border-gray-100 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
        ))}
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

  const project = contract.project;
  const companyName = (project as typeof project & { company?: { name?: string } })?.company?.name;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
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
          {companyName && (
            <p className="text-sm text-gray-500 mt-0.5">{isCompany ? 'Tu empresa' : `Con ${companyName}`}</p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white rounded-xl border border-gray-100 p-1 mb-4 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === t.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 bg-primary-50 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={tab}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {tab === 'chat' && <ChatTab contractId={contract.id} />}
          {tab === 'milestones' && (
            <MilestonesTab milestones={contract.milestones} contractId={contract.id} isCompany={isCompany} />
          )}
          {tab === 'resumen' && <ResumenTab contract={contract} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
