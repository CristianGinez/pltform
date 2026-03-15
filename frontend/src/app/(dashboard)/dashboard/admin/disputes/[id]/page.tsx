'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ShieldAlert, CheckCircle, Circle, Clock, AlertCircle,
  Send, Gavel, ThumbsUp, ThumbsDown, Handshake, X, ExternalLink,
  MessageSquare, ListChecks, DollarSign, Edit3, Rocket, RotateCcw,
  Ban, Activity, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useContract, useContractMessages, useResolveDispute } from '@/hooks/use-contracts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ContractMessage, MilestoneStatus, MessageProposalStatus } from '@/types';

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', SUBMITTED: 'Entregado',
  REVISION_REQUESTED: 'Revisión', APPROVED: 'Aprobado', PAID: 'Pagado',
};
const STATUS_COLORS: Record<MilestoneStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700', REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700', PAID: 'bg-emerald-100 text-emerald-700',
};

const PROPOSAL_LABELS: Record<string, { label: string; color: string }> = {
  PROPOSE_START:    { label: 'Propone iniciar', color: 'text-blue-700' },
  PROPOSE_SUBMIT:   { label: 'Propone entregar', color: 'text-yellow-700' },
  PROPOSE_REVISION: { label: 'Pide revisión', color: 'text-orange-700' },
  PROPOSE_APPROVE:  { label: 'Propone aprobar', color: 'text-green-700' },
  PROPOSE_CANCEL:   { label: 'Propone cancelar', color: 'text-gray-600' },
  PROPOSE_MILESTONE_PLAN: { label: 'Plan de milestones', color: 'text-primary-700' },
};

const EVENT_COLORS: Record<string, string> = {
  MILESTONE_STARTED: 'bg-blue-50 border-blue-200 text-blue-800',
  MILESTONE_SUBMITTED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-50 border-orange-200 text-orange-800',
  MILESTONE_PAID: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  CONTRACT_COMPLETED: 'bg-purple-50 border-purple-200 text-purple-800',
  PROGRESS_UPDATE: 'bg-sky-50 border-sky-200 text-sky-800',
  READY_FOR_TESTING: 'bg-purple-50 border-purple-200 text-purple-800',
  DISPUTE_OPENED: 'bg-red-50 border-red-200 text-red-800',
  DISPUTE_RESOLVED: 'bg-green-50 border-green-200 text-green-800',
  CONTRACT_CANCELLED_MUTUAL: 'bg-gray-50 border-gray-200 text-gray-700',
};

function useAdminContractMessages(contractId: string) {
  return useQuery<ContractMessage[]>({
    queryKey: ['contract-messages-admin', contractId],
    queryFn: () => api.get(`/contracts/${contractId}/messages/admin`).then((r) => r.data),
    enabled: !!contractId,
    refetchInterval: 10_000,
  });
}

function AdminMessage({ msg }: { msg: ContractMessage }) {
  if (msg.type === 'EVENT') {
    const action = msg.metadata?.action ?? '';
    const colorClass = EVENT_COLORS[action] ?? 'bg-gray-50 border-gray-200 text-gray-700';
    return (
      <div className="flex justify-center">
        <div className={`flex items-start gap-2 px-4 py-2.5 rounded-xl border text-xs max-w-sm w-full ${colorClass}`}>
          <div className="min-w-0">
            <p className="font-medium leading-snug">{msg.content}</p>
            <p className="text-[10px] opacity-60 mt-0.5">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'PROPOSAL') {
    const action = msg.metadata?.action ?? '';
    const info = PROPOSAL_LABELS[action] ?? { label: action, color: 'text-gray-700' };
    const status = (msg.metadata?.proposalStatus ?? 'PENDING') as MessageProposalStatus;
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
      <div className="flex justify-center">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[status] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusLabel[status] ?? status}
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-gray-700">{msg.metadata?.milestoneTitle}</p>
            {msg.metadata?.deliveryNote && (
              <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Nota:</span> {msg.metadata.deliveryNote}</p>
            )}
            {msg.metadata?.deliveryLink && (
              <a href={msg.metadata.deliveryLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                <ExternalLink size={10} />Ver entregable
              </a>
            )}
            {action === 'PROPOSE_MILESTONE_PLAN' && msg.metadata?.milestones && (
              <div className="mt-2 space-y-1">
                {(msg.metadata.milestones as Array<{title: string; amount: number}>).map((m, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                    <span>{i+1}. {m.title}</span>
                    <span className="font-medium">S/ {Number(m.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">
              {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              {' · '}por {msg.sender.company?.name ?? msg.sender.developer?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const name = msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';
  const isCounter = msg.metadata?.isCounter === true;
  const bubbleColor = isCounter
    ? 'bg-orange-50 border border-orange-200 text-orange-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 px-1">{name}</span>
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${bubbleColor}`}>
        {msg.content}
      </div>
      <span className="text-[10px] text-gray-400 px-1">
        {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: contract, isLoading } = useContract(id);
  const { data: messages = [], isLoading: isLoadingMessages } = useAdminContractMessages(id);
  const resolve = useResolveDispute(id);
  const [confirmOutcome, setConfirmOutcome] = useState<'dev_wins' | 'company_wins' | 'mutual' | null>(null);
  const [adminComment, setAdminComment] = useState('');

  if (!user || user.role !== 'ADMIN') {
    return <div className="text-center py-16 text-gray-400">Acceso denegado</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Contrato no encontrado.</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-blue-600 hover:underline cursor-pointer">Volver</button>
      </div>
    );
  }

  const project = contract.project;
  const companyName = project?.company?.name ?? 'Empresa';
  const devName = project?.proposals?.[0]?.developer?.name ?? 'Developer';
  const submittedCount = contract.milestones.filter((m) => m.status === 'SUBMITTED').length;
  const paidCount = contract.milestones.filter((m) => m.status === 'PAID').length;

  const outcomeColors = {
    dev_wins: 'bg-green-600 hover:bg-green-700',
    company_wins: 'bg-red-600 hover:bg-red-700',
    mutual: 'bg-gray-600 hover:bg-gray-700',
  };
  const outcomeLabels = {
    dev_wins: 'A favor del developer',
    company_wins: 'A favor de la empresa',
    mutual: 'Cancelación mutua',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Gavel size={16} className="text-red-500" />
            <h1 className="font-bold text-gray-900 text-lg truncate">{project.title ?? 'Disputa'}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
              {contract.status === 'DISPUTED' ? 'En disputa' : contract.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{companyName} · {devName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: Chat */}
        <div className="space-y-4">
          {/* Dispute reason */}
          {contract.disputeReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Motivo de la disputa</p>
                <p className="text-sm text-red-700 mt-0.5">{contract.disputeReason}</p>
              </div>
            </div>
          )}

          {/* Chat */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={15} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Historial del chat</span>
              <span className="text-xs text-gray-400">({messages.length} mensajes)</span>
            </div>
            <div className="flex flex-col gap-3 p-4 max-h-125 overflow-y-auto">
              {isLoadingMessages && (
                <div className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
              {!isLoadingMessages && messages.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No hay mensajes en este contrato.</div>
              )}
              {messages.map((msg) => (
                <AdminMessage key={msg.id} msg={msg} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Info + Decision */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Milestone progress */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks size={15} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Estado de milestones</span>
            </div>
            {contract.milestones.length === 0 ? (
              <p className="text-xs text-gray-400">Sin milestones</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {contract.milestones.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-4 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-gray-700 truncate">{m.title}</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status as MilestoneStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[m.status as MilestoneStatus] ?? m.status}
                      </span>
                      <span className="text-gray-500 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>{submittedCount} milestone{submittedCount !== 1 ? 's' : ''} en SUBMITTED (se pagarían si developer gana)</p>
                  <p>{paidCount} ya pagado{paidCount !== 1 ? 's' : ''}</p>
                </div>
              </>
            )}
          </div>

          {/* Decision panel */}
          {contract.status === 'DISPUTED' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gavel size={15} className="text-red-500" />
                <span className="text-sm font-semibold text-gray-700">Tomar decisión</span>
              </div>

              {!confirmOutcome ? (
                <div className="space-y-2">
                  <button onClick={() => setConfirmOutcome('dev_wins')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 cursor-pointer">
                    <ThumbsUp size={14} />A favor del developer
                  </button>
                  <button onClick={() => setConfirmOutcome('company_wins')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer">
                    <ThumbsDown size={14} />A favor de la empresa
                  </button>
                  <button onClick={() => setConfirmOutcome('mutual')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-600 text-white hover:bg-gray-700 cursor-pointer">
                    <Handshake size={14} />Cancelación mutua
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    · Developer gana: milestones SUBMITTED se pagan<br />
                    · Empresa gana: contrato CANCELLED, dev pierde 30 trust points<br />
                    · Mutuo: CANCELLED sin penalización
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-xl p-4 space-y-3 ${
                      confirmOutcome === 'dev_wins' ? 'bg-green-50 border-green-200' :
                      confirmOutcome === 'company_wins' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                    <p className="text-sm font-semibold text-gray-800">Confirmar: {outcomeLabels[confirmOutcome]}</p>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Comentario para las partes</label>
                      <textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Explica brevemente la decisión..."
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmOutcome(null)}
                        className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        Cancelar
                      </button>
                      <button
                        onClick={() => resolve.mutate(
                          { outcome: confirmOutcome, adminComment: adminComment.trim() || undefined },
                          { onSuccess: () => router.back() }
                        )}
                        disabled={resolve.isPending}
                        className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60 cursor-pointer ${outcomeColors[confirmOutcome]}`}
                      >
                        {resolve.isPending ? 'Procesando...' : 'Confirmar resolución'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          {contract.status !== 'DISPUTED' && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
              <CheckCircle size={20} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Esta disputa ya fue resuelta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
