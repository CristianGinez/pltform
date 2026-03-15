'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useMyProposals, useWithdrawProposal } from '@/hooks/use-proposals';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import type { Proposal } from '@/types';

type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

const TAB_ORDER: ProposalStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

const TAB_CONFIG: Record<ProposalStatus, { label: string; icon: React.ReactNode; activeText: string; activeBorder: string }> = {
  PENDING:   { label: 'Pendientes',  icon: <Clock size={12} />,        activeText: 'text-yellow-600', activeBorder: 'border-yellow-500' },
  ACCEPTED:  { label: 'Aceptadas',   icon: <CheckCircle size={12} />,  activeText: 'text-green-600',  activeBorder: 'border-green-500'  },
  REJECTED:  { label: 'Rechazadas',  icon: <XCircle size={12} />,      activeText: 'text-red-500',    activeBorder: 'border-red-400'    },
  WITHDRAWN: { label: 'Retiradas',   icon: <MinusCircle size={12} />,  activeText: 'text-gray-500',   activeBorder: 'border-gray-400'   },
};

const STATUS_COLORS: Record<ProposalStatus, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700',
  ACCEPTED:  'bg-green-50 text-green-700',
  REJECTED:  'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function ProposalsPage() {
  const { data: proposals = [], isLoading } = useMyProposals();
  const withdraw = useWithdrawProposal();
  const [activeTab, setActiveTab] = useState<ProposalStatus>('PENDING');
  const [withdrawTarget, setWithdrawTarget] = useState<Proposal | null>(null);

  const groups = TAB_ORDER.reduce<Record<ProposalStatus, Proposal[]>>(
    (acc, s) => ({ ...acc, [s]: proposals.filter((p) => p.status === s) }),
    {} as Record<ProposalStatus, Proposal[]>,
  );

  // Default to first tab with items if PENDING is empty
  const initialTab = (groups.PENDING.length > 0 ? 'PENDING' : TAB_ORDER.find((s) => groups[s].length > 0)) ?? 'PENDING';
  const tab = activeTab === 'PENDING' && groups.PENDING.length === 0 && initialTab !== 'PENDING' ? initialTab : activeTab;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis propuestas</h1>
        <p className="text-sm text-gray-500 mt-1">Seguimiento de todas tus postulaciones.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && proposals.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Aún no has enviado ninguna propuesta.</p>
          <Link href="/projects" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
            Explorar proyectos disponibles →
          </Link>
        </div>
      )}

      {!isLoading && proposals.length > 0 && (
        <>
          {/* Tabs */}
          <div className="relative mb-6">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex border-b border-gray-200">
                {TAB_ORDER.map((status) => {
                  const cfg = TAB_CONFIG[status];
                  const count = groups[status].length;
                  const isSelected = tab === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveTab(status)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                        isSelected
                          ? `${cfg.activeText} ${cfg.activeBorder}`
                          : 'text-gray-400 border-transparent hover:text-gray-500'
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                      <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none ${
                        isSelected ? 'bg-gray-100 ' + cfg.activeText : 'bg-gray-100 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-gray-50 to-transparent" />
          </div>

          {/* List */}
          <div className="space-y-3 min-h-48">
            {groups[tab].length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-sm text-gray-400">No hay propuestas en esta sección.</p>
              </div>
            ) : (
              groups[tab].map((proposal: Proposal) => {
                const project = proposal.project as (typeof proposal.project & { company?: { name?: string }; contract?: { id: string } });
                const contractId = project?.contract?.id;
                return (
                  <Link key={proposal.id} href={`/dashboard/projects/${proposal.projectId}`}
                    className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-medium text-sm text-gray-900 group-hover:text-primary-700 transition-colors [overflow-wrap:anywhere]">
                            {project?.title ?? 'Proyecto'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[proposal.status as ProposalStatus]}`}>
                            {TAB_CONFIG[proposal.status as ProposalStatus].label}
                          </span>
                        </div>

                        {project?.company && (
                          <p className="text-xs text-gray-400 truncate">{project.company.name}</p>
                        )}

                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 [overflow-wrap:anywhere]">{proposal.coverLetter}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                          <span>S/ <span className="text-gray-700 font-medium">{Number(proposal.budget).toLocaleString()}</span></span>
                          <span><span className="text-gray-700 font-medium">{proposal.timeline}</span> días</span>
                          <span>{new Date(proposal.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                        {proposal.status === 'ACCEPTED' && (
                          <Link
                            href={contractId ? `/dashboard/contracts/${contractId}` : '/dashboard/contracts'}
                            className="text-xs text-primary-600 hover:underline whitespace-nowrap font-medium"
                          >
                            Ir al contrato →
                          </Link>
                        )}
                        {proposal.status === 'PENDING' && (
                          <button
                            onClick={(e) => { e.preventDefault(); setWithdrawTarget(proposal); }}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            Retirar
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {withdrawTarget && (
          <ConfirmModal
            title="¿Retirar propuesta?"
            message={<>¿Estás seguro de que quieres retirar tu propuesta para <span className="font-medium text-gray-700">&quot;{withdrawTarget.project?.title ?? 'este proyecto'}&quot;</span>? Podrás volver a postular si el proyecto sigue abierto.</>}
            confirmText="Sí, retirar"
            variant="danger"
            icon={<MinusCircle size={32} className="text-red-400" />}
            loading={withdraw.isPending}
            onConfirm={() => withdraw.mutate(withdrawTarget.id, { onSuccess: () => setWithdrawTarget(null) })}
            onCancel={() => setWithdrawTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
