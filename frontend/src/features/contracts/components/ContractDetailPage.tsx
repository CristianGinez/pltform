'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, ListChecks, LayoutDashboard,
  Ban, ShieldAlert, CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  useContract, useContractMessages,
  useProposeCancel,
} from '@/hooks/use-contracts';
import type { Contract } from '@/types';
import {
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
  TAB_ORDER, type Tab,
} from '../constants';
import { getDisputeStatusLabel } from '../utils';
import { ProfileCard, EmptyProfileCard } from './ProfileCard';
import { RepublishButton, RevertToDraftButton } from './RepublishButton';
import { DisputeModal } from './DisputeModal';
import { ChatTab } from './ChatTab';
import { MilestonesTab } from './MilestonesTab';
import { ResumenTab, CompletionOverlay } from './ResumenTab';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat',       label: 'Chat',       icon: <MessageSquare size={14} /> },
  { id: 'milestones', label: 'Milestones', icon: <ListChecks size={14} /> },
  { id: 'resumen',    label: 'Resumen',    icon: <LayoutDashboard size={14} /> },
];

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: contract, isLoading, error } = useContract(id);
  const { data: messages = [], isLoading: isLoadingMessages } = useContractMessages(id);
  const [tab, setTab] = useState<Tab>('chat');
  const [direction, setDirection] = useState(0);
  const [showRateOverlay, setShowRateOverlay] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const proposeCancel = useProposeCancel(id);

  const isCompany = user?.role === 'COMPANY';

  const switchTab = (next: Tab) => {
    const from = TAB_ORDER.indexOf(tab);
    const to = TAB_ORDER.indexOf(next);
    setDirection(to > from ? 1 : -1);
    setTab(next);
  };

  const chatBadge = messages.filter(
    (m) => m.type === 'PROPOSAL' && m.metadata?.proposalStatus === 'PENDING' && m.sender.id !== user?.id
  ).length;
  const milestoneBadge = contract
    ? contract.milestones.filter((m) =>
        isCompany ? m.status === 'SUBMITTED' : ['PENDING', 'REVISION_REQUESTED'].includes(m.status)
      ).length
    : 0;

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
        <button onClick={() => router.back()} className="mt-3 text-sm text-primary-600 hover:underline cursor-pointer">Volver</button>
      </div>
    );
  }

  const project = contract.project as typeof contract.project & {
    company?: { id?: string; name?: string; logoUrl?: string | null; industry?: string | null };
    proposals?: Array<{
      developer?: { id?: string; name: string; avatarUrl?: string | null; rating?: number; skills?: string[] };
    }>;
  };
  const myReview = (contract as typeof contract & { reviews?: Array<{ id: string; rating: number; comment?: string }> }).reviews?.[0];
  const companyInfo = project?.company;
  const devInfo = project?.proposals?.[0]?.developer;
  const otherName = isCompany
    ? (devInfo?.name ?? 'el developer')
    : (companyInfo?.name ?? 'la empresa');

  return (
    <div className="max-w-5xl mx-auto px-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-gray-900 text-lg truncate">{project?.title ?? 'Contrato'}</h1>
            {(() => {
              const disputeLabel = getDisputeStatusLabel(contract as { status: string; disputeOutcome?: string | null }, isCompany);
              const label = disputeLabel?.label ?? CONTRACT_STATUS_LABELS[contract.status] ?? contract.status;
              const color = disputeLabel?.color ?? CONTRACT_STATUS_COLORS[contract.status] ?? 'bg-gray-100 text-gray-600';
              return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${color}`}>{label}</span>;
            })()}
          </div>
        </div>
        {contract.status === 'ACTIVE' && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors hidden sm:block cursor-pointer">
              Proponer cancelación
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              title="Proponer cancelación"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors sm:hidden cursor-pointer">
              <Ban size={14} />
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="text-xs px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors items-center gap-1 hidden sm:flex cursor-pointer">
              <ShieldAlert size={12} />Abrir disputa
            </button>
            <button
              onClick={() => setShowDisputeModal(true)}
              title="Abrir disputa"
              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors sm:hidden cursor-pointer">
              <ShieldAlert size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Dispute banner */}
      {contract.status === 'DISPUTED' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Contrato en disputa</p>
            {(contract as typeof contract & { disputeReason?: string }).disputeReason && (
              <p className="text-xs text-red-600 mt-0.5">
                Motivo: "{(contract as typeof contract & { disputeReason?: string }).disputeReason}"
              </p>
            )}
            <p className="text-xs text-red-500 mt-1">El equipo está revisando el caso y resolverá a la brevedad.</p>
          </div>
        </div>
      )}

      {/* Cancelled banner — company */}
      {contract.status === 'CANCELLED' && isCompany && contract.project?.id && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Ban size={18} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Contrato cancelado</p>
              <p className="text-xs text-gray-500 mt-0.5">Este contrato fue cancelado. Puedes republicar el proyecto directamente o convertirlo a borrador para editarlo antes de publicar.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <RepublishButton projectId={contract.project.id} />
                <RevertToDraftButton
                  projectId={contract.project.id}
                  onSuccess={() => router.push(`/dashboard/projects/${contract.project!.id}`)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cancelled banner — developer */}
      {contract.status === 'CANCELLED' && !isCompany && (
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <Ban size={18} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Contrato cancelado</p>
            <p className="text-xs text-gray-500 mt-0.5">Este contrato fue cancelado.</p>
          </div>
        </div>
      )}

      {/* Dispute resolved banner */}
      {(contract as Contract).disputeOutcome && (
        (() => {
          const outcome = (contract as Contract).disputeOutcome!;
          const disputeLabel = getDisputeStatusLabel(contract as { status: string; disputeOutcome?: string | null }, isCompany);
          const isWinner = disputeLabel?.label === 'Resuelto a tu favor';
          const isMutual = outcome === 'mutual';
          const bg = isMutual ? 'bg-gray-50 border-gray-200' : isWinner ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
          const iconColor = isMutual ? 'text-gray-400' : isWinner ? 'text-green-500' : 'text-orange-400';
          const titleColor = isMutual ? 'text-gray-700' : isWinner ? 'text-green-800' : 'text-orange-800';
          const textColor = isMutual ? 'text-gray-600' : isWinner ? 'text-green-700' : 'text-orange-700';
          const title = isMutual ? 'Contrato cancelado por mutuo acuerdo' : isWinner ? '¡Disputa resuelta a tu favor!' : 'Disputa resuelta en tu contra';
          const canRate = !myReview && (contract.status === 'COMPLETED' || outcome === 'company_wins');
          return (
            <div className={`mb-4 rounded-xl p-4 flex items-start gap-3 border ${bg}`}>
              <CheckCircle size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
                {(contract as Contract).disputeResolvedComment && (
                  <p className={`text-xs mt-0.5 ${textColor}`}>
                    Comentario del admin: &ldquo;{(contract as Contract).disputeResolvedComment}&rdquo;
                  </p>
                )}
                {canRate && (
                  <button
                    onClick={() => setShowRateOverlay(true)}
                    className={`mt-2 text-xs underline hover:opacity-70 cursor-pointer ${textColor}`}
                  >
                    Calificar a {otherName} →
                  </button>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* Dispute modal */}
      <AnimatePresence>
        {showDisputeModal && <DisputeModal contractId={contract.id} onClose={() => setShowDisputeModal(false)} />}
      </AnimatePresence>

      {/* Propose cancel confirm */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 text-center">
              <Ban size={32} className="text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Proponer cancelación</h3>
              <p className="text-sm text-gray-500 mb-4">
                Se enviará una propuesta de cancelación por mutuo acuerdo. La otra parte deberá aceptarla para que el contrato se cancele.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={() => proposeCancel.mutate(undefined, { onSuccess: () => setShowCancelConfirm(false) })}
                  disabled={proposeCancel.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold bg-gray-700 text-white rounded-xl hover:bg-gray-800 disabled:opacity-60 cursor-pointer">
                  {proposeCancel.isPending ? 'Enviando...' : 'Proponer cancelación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">
        {/* Left: "Your" card */}
        <div className="hidden lg:block sticky top-4 w-[200px] shrink-0">
          {isCompany ? (
            companyInfo
              ? <ProfileCard name={companyInfo.name ?? 'Empresa'} role="company" logoUrl={companyInfo.logoUrl} extra={companyInfo.industry} isCurrentUser profileHref={undefined} />
              : <EmptyProfileCard label="Empresa" />
          ) : (
            devInfo
              ? <ProfileCard name={devInfo.name} role="developer" avatarUrl={devInfo.avatarUrl} rating={devInfo.rating} extra={devInfo.skills?.slice(0,2).join(', ')} isCurrentUser profileHref={undefined} />
              : <EmptyProfileCard label="Developer" />
          )}
        </div>

        {/* Center: Tab bar + content */}
        <div className="flex-1 min-w-0">
          <div className="flex bg-white rounded-xl border border-gray-100 p-1 mb-4 gap-1">
            {TABS.map((t) => {
              const badge = t.id === 'chat' ? chatBadge : t.id === 'milestones' ? milestoneBadge : 0;
              return (
                <button key={t.id} onClick={() => switchTab(t.id)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    tab === t.id ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === t.id && (
                    <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-primary-50 rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {t.icon}
                    {t.label}
                    {badge > 0 && (
                      <span className="ml-0.5 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={tab} custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}>
              {tab === 'chat' && (
                <ChatTab
                  contractId={contract.id}
                  messages={messages}
                  isLoadingMessages={isLoadingMessages}
                  onGoToMilestones={() => switchTab('milestones')}
                  locked={contract.status !== 'ACTIVE'}
                />
              )}
              {tab === 'milestones' && (
                <MilestonesTab
                  milestones={contract.milestones}
                  contractId={contract.id}
                  isCompany={isCompany}
                  onProposed={() => switchTab('chat')}
                />
              )}
              {tab === 'resumen' && (
                <ResumenTab
                  contract={contract}
                  myReview={myReview}
                  isCompleted={contract.status === 'COMPLETED' || !!(contract as Contract).disputeOutcome}
                  otherName={otherName}
                  onRate={() => setShowRateOverlay(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Other party's card */}
        <div className="hidden lg:block sticky top-4 w-[200px] shrink-0">
          {isCompany ? (
            devInfo
              ? <ProfileCard name={devInfo.name} role="developer" avatarUrl={devInfo.avatarUrl} rating={devInfo.rating} extra={devInfo.skills?.slice(0,2).join(', ')} profileHref={(devInfo as { id?: string }).id ? `/developers/${(devInfo as { id?: string }).id}` : undefined} />
              : <EmptyProfileCard label="Developer" />
          ) : (
            companyInfo
              ? <ProfileCard name={companyInfo.name ?? 'Empresa'} role="company" logoUrl={companyInfo.logoUrl} extra={companyInfo.industry} profileHref={(companyInfo as { id?: string }).id ? `/companies/${(companyInfo as { id?: string }).id}` : undefined} />
              : <EmptyProfileCard label="Empresa" />
          )}
        </div>
      </div>

      {/* Completion overlay */}
      {contract.status === 'COMPLETED' && (
        <CompletionOverlay
          contract={contract}
          currentUserId={user?.id}
          alreadyReviewed={!!myReview}
        />
      )}
      {showRateOverlay && (contract.status === 'COMPLETED' || !!(contract as Contract).disputeOutcome) && !myReview && (
        <CompletionOverlay
          key="manual-rate"
          contract={contract}
          currentUserId={user?.id}
          alreadyReviewed={false}
          skipAnimate
          ignoreStorage
          onClose={() => setShowRateOverlay(false)}
        />
      )}
    </div>
  );
}
