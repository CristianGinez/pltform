'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProposals } from '@/hooks/use-proposals';
import { useMyProjects } from '@/hooks/use-projects';
import type { Project, Proposal, Milestone } from '@/types';

type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';

type ProjectWithContract = Project & {
  contract?: {
    id: string;
    status: ContractStatus;
    milestones: Milestone[];
  };
  company?: { name?: string };
  proposals?: Proposal[];
};

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Circle size={14} className="text-gray-300" />,
  IN_PROGRESS: <Clock size={14} className="text-blue-500" />,
  SUBMITTED: <Clock size={14} className="text-yellow-500" />,
  REVISION_REQUESTED: <Clock size={14} className="text-orange-500" />,
  APPROVED: <CheckCircle size={14} className="text-green-500" />,
  PAID: <CheckCircle size={14} className="text-green-700" />,
};

const TAB_CONFIG: Record<ContractStatus, { label: string; icon: React.ReactNode; activeText: string; activeBorder: string }> = {
  ACTIVE:    { label: 'Activos',     icon: <Clock size={12} />,         activeText: 'text-blue-600',    activeBorder: 'border-blue-500' },
  DISPUTED:  { label: 'En disputa',  icon: <AlertTriangle size={12} />, activeText: 'text-orange-500',  activeBorder: 'border-orange-400' },
  COMPLETED: { label: 'Completados', icon: <CheckCircle size={12} />,   activeText: 'text-emerald-600', activeBorder: 'border-emerald-500' },
  CANCELLED: { label: 'Cancelados',  icon: <XCircle size={12} />,       activeText: 'text-gray-500',    activeBorder: 'border-gray-400' },
};

const TAB_ORDER: ContractStatus[] = ['ACTIVE', 'DISPUTED', 'COMPLETED', 'CANCELLED'];

// ─── Cards ────────────────────────────────────────────────────────────────────

function MilestoneProgress({ milestones }: { milestones: Milestone[] }) {
  const paid = milestones.filter((m) => m.status === 'PAID').length;
  const hasActive = milestones.some((m) => ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED'].includes(m.status));
  const pct = Math.max(milestones.length > 0 ? (paid / milestones.length) * 100 : 0, hasActive ? 5 : 0);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">Progreso</p>
        <p className="text-xs text-gray-400">{paid}/{milestones.length}</p>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-linear-to-r from-primary-400 to-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-1.5 mt-1.5 flex-wrap">
        {milestones.map((m) => (
          <span key={m.id} className={`w-2 h-2 rounded-full ${
            m.status === 'PAID' ? 'bg-emerald-500' :
            m.status === 'IN_PROGRESS' ? 'bg-blue-400' :
            m.status === 'SUBMITTED' ? 'bg-yellow-400' :
            m.status === 'REVISION_REQUESTED' ? 'bg-orange-400' : 'bg-gray-200'
          }`} title={m.title} />
        ))}
      </div>
    </div>
  );
}

function CompanyCard({ project }: { project: ProjectWithContract }) {
  const href = project.contract ? `/dashboard/contracts/${project.contract.id}` : '#';
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 [overflow-wrap:anywhere] group-hover:text-primary-700 transition-colors">{project.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">S/ {Number(project.budget).toLocaleString()}</p>
          </div>
        </div>
        {project.contract?.milestones && project.contract.milestones.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5">Milestones</p>
            <div className="space-y-1">
              {project.contract.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  {MILESTONE_ICONS[m.status] ?? <Circle size={14} />}
                  <span className="flex-1 min-w-0 text-gray-600 text-xs [overflow-wrap:anywhere]">{m.title}</span>
                  <span className="text-gray-400 text-xs">S/ {Number(m.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function DevCard({ proposal }: { proposal: Proposal }) {
  const project = proposal.project as ProjectWithContract | undefined;
  const href = project?.contract ? `/dashboard/contracts/${project.contract.id}` : '#';
  const milestones = project?.contract?.milestones ?? [];
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 [overflow-wrap:anywhere] group-hover:text-primary-700 transition-colors">{project?.title ?? 'Proyecto'}</p>
            {project?.company && <p className="text-xs text-gray-400 mt-0.5 truncate">{project.company.name}</p>}
            <p className="text-xs text-gray-500 mt-1">
              S/ <span className="font-medium">{Number(proposal.budget).toLocaleString()}</span>
              {' · '}{proposal.timeline} días
            </p>
          </div>
        </div>
        {milestones.length > 0 && <MilestoneProgress milestones={milestones} />}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { user } = useAuthStore();
  const isCompany = user?.role === 'COMPANY';
  const [activeTab, setActiveTab] = useState<ContractStatus>('ACTIVE');

  const { data: allProjects = [], isLoading: loadingCompany } = useMyProjects(isCompany);
  const { data: allProposals = [], isLoading: loadingDev } = useMyProposals();
  const isLoading = loadingCompany || loadingDev;

  const projectsWithContract = (allProjects as ProjectWithContract[]).filter((p) => !!p.contract);
  const acceptedProposals = allProposals.filter((p) => p.status === 'ACCEPTED');

  const groups = TAB_ORDER.reduce<Record<ContractStatus, (ProjectWithContract | Proposal)[]>>(
    (acc, s) => ({
      ...acc,
      [s]: isCompany
        ? projectsWithContract.filter((p) => (p.contract?.status ?? 'ACTIVE') === s)
        : acceptedProposals.filter((p) => {
            const proj = (p as Proposal).project as ProjectWithContract | undefined;
            return (proj?.contract?.status ?? 'ACTIVE') === s;
          }),
    }),
    {} as Record<ContractStatus, (ProjectWithContract | Proposal)[]>,
  );

  const hasAny = isCompany ? projectsWithContract.length > 0 : acceptedProposals.length > 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isCompany ? 'Proyectos con contratos activos y anteriores.' : 'Proyectos en los que estás trabajando.'}
        </p>
      </div>

      {/* Tabs */}
      {!isLoading && hasAny && (
        <div className="relative mb-6">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex min-w-max border-b border-gray-200">
              {TAB_ORDER.map((status) => {
                const cfg = TAB_CONFIG[status];
                const count = groups[status].length;
                const isSelected = activeTab === status;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveTab(status)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                      isSelected
                        ? `${cfg.activeText} ${cfg.activeBorder}`
                        : 'text-gray-400 border-transparent hover:text-gray-500'
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                    <span className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none ${
                      isSelected ? 'bg-gray-100 ' + cfg.activeText : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !hasAny && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">No tienes contratos aún.</p>
          {isCompany ? (
            <Link href="/dashboard/projects/new" className="mt-3 inline-block text-sm text-primary-600 hover:underline">Crea tu primer proyecto →</Link>
          ) : (
            <Link href="/projects" className="mt-3 inline-block text-sm text-primary-600 hover:underline">Explorar proyectos →</Link>
          )}
        </div>
      )}

      {!isLoading && hasAny && (
        <div className="space-y-3 min-h-48">
          {groups[activeTab].length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-sm text-gray-400">No hay contratos en esta sección.</p>
            </div>
          ) : isCompany ? (
            (groups[activeTab] as ProjectWithContract[]).map((p) => <CompanyCard key={p.id} project={p} />)
          ) : (
            (groups[activeTab] as Proposal[]).map((p) => <DevCard key={p.id} proposal={p} />)
          )}
        </div>
      )}
    </div>
  );
}
