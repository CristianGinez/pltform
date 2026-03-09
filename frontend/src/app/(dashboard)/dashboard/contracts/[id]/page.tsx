'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useContract, useStartMilestone, useSubmitMilestone, useApproveMilestone, useRequestRevision, useContractMessages, useSendMessage } from '@/hooks/use-contracts';
import type { Milestone, MilestoneStatus, ContractMessage } from '@/types';

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

function StatusIcon({ status }: { status: MilestoneStatus }) {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
      return <CheckCircle size={16} className="text-emerald-600" />;
    case 'SUBMITTED':
      return <Clock size={16} className="text-yellow-600" />;
    case 'REVISION_REQUESTED':
      return <AlertCircle size={16} className="text-orange-600" />;
    case 'IN_PROGRESS':
      return <Clock size={16} className="text-blue-500" />;
    default:
      return <Circle size={16} className="text-gray-300" />;
  }
}

// ─── Submit Modal ──────────────────────────────────────────────────────────────

function SubmitModal({
  milestone,
  contractId,
  onClose,
}: {
  milestone: Milestone;
  contractId: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState(milestone.deliveryNote ?? '');
  const [link, setLink] = useState(milestone.deliveryLink ?? '');
  const submit = useSubmitMilestone();

  const handleSubmit = () => {
    submit.mutate(
      { contractId, milestoneId: milestone.id, deliveryNote: note, deliveryLink: link },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {submit.isPending ? 'Enviando...' : 'Confirmar entrega'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Revision Modal ────────────────────────────────────────────────────────────

function RevisionModal({
  milestone,
  contractId,
  onClose,
}: {
  milestone: Milestone;
  contractId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const requestRevision = useRequestRevision();

  const handleSubmit = () => {
    requestRevision.mutate(
      { contractId, milestoneId: milestone.id, reason },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={requestRevision.isPending}
            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60"
          >
            {requestRevision.isPending ? 'Enviando...' : 'Confirmar revisión'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Milestone Card ────────────────────────────────────────────────────────────

function MilestoneCard({
  milestone,
  contractId,
  isCompany,
}: {
  milestone: Milestone;
  contractId: string;
  isCompany: boolean;
}) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const startMilestone = useStartMilestone();
  const approveMilestone = useApproveMilestone();

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon status={milestone.status} />
            <span className="font-medium text-gray-900">{milestone.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[milestone.status]}`}>
              {STATUS_LABELS[milestone.status]}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              S/ {Number(milestone.amount).toLocaleString()}
            </span>
          </div>
        </div>

        {milestone.description && (
          <p className="text-sm text-gray-500 mb-3">{milestone.description}</p>
        )}

        {/* Delivery info (visible when submitted or later) */}
        {(milestone.status === 'SUBMITTED' ||
          milestone.status === 'REVISION_REQUESTED' ||
          milestone.status === 'APPROVED' ||
          milestone.status === 'PAID') &&
          (milestone.deliveryNote || milestone.deliveryLink) && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              {milestone.deliveryNote && (
                <p className="text-gray-700 mb-1">
                  <span className="font-medium">Nota:</span> {milestone.deliveryNote}
                </p>
              )}
              {milestone.deliveryLink && (
                <a
                  href={milestone.deliveryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  {milestone.deliveryLink}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                <Play size={13} />
                Iniciar
              </button>
            )}
            {(milestone.status === 'IN_PROGRESS' || milestone.status === 'REVISION_REQUESTED') && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              <ThumbsUp size={13} />
              Aprobar
            </button>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
            >
              <MessageSquare size={13} />
              Pedir revisión
            </button>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <SubmitModal
          milestone={milestone}
          contractId={contractId}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
      {showRevisionModal && (
        <RevisionModal
          milestone={milestone}
          contractId={contractId}
          onClose={() => setShowRevisionModal(false)}
        />
      )}
    </>
  );
}

// ─── Contract Chat ─────────────────────────────────────────────────────────────

function ContractChat({ contractId }: { contractId: string }) {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderName = (msg: ContractMessage) =>
    msg.sender.company?.name ?? msg.sender.developer?.name ?? 'Usuario';

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mensajes</h2>
      <div className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Messages area */}
        <div className="flex flex-col gap-3 p-4 h-72 overflow-y-auto">
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="h-12 w-48 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
              ))}
            </>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400">No hay mensajes aún. ¡Inicia la conversación!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.sender.id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className="flex items-center gap-1.5 px-1">
                    {!isOwn && (
                      <span className="text-xs font-medium text-gray-500">{getSenderName(msg)}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      <span className="text-xs font-medium text-gray-500">{getSenderName(msg)}</span>
                    )}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isOwn
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 p-3 flex gap-2 items-end">
          <textarea
            className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[40px] max-h-32"
            rows={1}
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="flex-shrink-0 p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: contract, isLoading, error } = useContract(id);

  const isCompany = user?.role === 'COMPANY';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
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
        <button onClick={() => router.back()} className="mt-3 text-sm text-primary-600 hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const project = contract.project;
  const companyName = (project as typeof project & { company?: { name?: string } })?.company?.name;

  const CONTRACT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    DISPUTED: 'En disputa',
    CANCELLED: 'Cancelado',
  };
  const CONTRACT_STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
    DISPUTED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  const totalAmount = contract.milestones.reduce((sum, m) => sum + Number(m.amount), 0);
  const paidAmount = contract.milestones
    .filter((m) => m.status === 'PAID')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-gray-900 text-lg truncate">
              {project?.title ?? 'Contrato'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${CONTRACT_STATUS_COLORS[contract.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
            </span>
          </div>
          {companyName && (
            <p className="text-sm text-gray-500 mt-0.5">
              {isCompany ? 'Tu empresa' : `Con ${companyName}`}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progreso de pagos</span>
          <span className="font-medium text-gray-800">
            S/ {paidAmount.toLocaleString()} / S/ {totalAmount.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: totalAmount > 0 ? `${(paidAmount / totalAmount) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {contract.milestones.filter((m) => m.status === 'PAID').length} de {contract.milestones.length} milestones pagados
        </p>
      </div>

      {/* Milestones */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Milestones</h2>
      <div className="space-y-3">
        {contract.milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            contractId={contract.id}
            isCompany={isCompany}
          />
        ))}
      </div>

      {contract.milestones.length === 0 && (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">Este contrato no tiene milestones definidos.</p>
        </div>
      )}

      <ContractChat contractId={contract.id} />
    </div>
  );
}
