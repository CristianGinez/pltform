'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProposals } from '@/hooks/use-proposals';
import { useMyProjects } from '@/hooks/use-projects';
import type { Project, Proposal, Milestone } from '@/types';

type ProjectWithContract = Project & {
  contract?: {
    id: string;
    status: string;
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

export default function ContractsPage() {
  const { user } = useAuthStore();

  // COMPANY: fetch their projects in progress
  const { data: allProjects = [], isLoading: loadingCompany } = useMyProjects();
  const companyProjects = (allProjects as ProjectWithContract[]).filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED',
  );

  // DEVELOPER: fetch accepted proposals
  const { data: allProposals = [], isLoading: loadingDev } = useMyProposals();
  const devProposals = allProposals.filter((p) => p.status === 'ACCEPTED');

  const isLoading = loadingCompany || loadingDev;

  const isCompany = user?.role === 'COMPANY';
  const hasContracts = isCompany ? companyProjects.length > 0 : devProposals.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isCompany ? 'Proyectos en curso y completados.' : 'Proyectos en los que estás trabajando.'}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !hasContracts && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">No tienes contratos activos aún.</p>
          {isCompany ? (
            <Link href="/dashboard/projects/new" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
              Crea tu primer proyecto →
            </Link>
          ) : (
            <Link href="/projects" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
              Explorar proyectos disponibles →
            </Link>
          )}
        </div>
      )}

      {/* COMPANY view */}
      {isCompany && (
        <div className="space-y-4">
          {companyProjects.map((project) => (
            <Link key={project.id} href={project.contract ? `/dashboard/contracts/${project.contract.id}` : '#'} className="block">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 [overflow-wrap:anywhere]">{project.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Presupuesto: S/ {Number(project.budget).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {project.status === 'IN_PROGRESS' ? 'En progreso' : 'Completado'}
                    </span>
                  </div>
                </div>

                {project.contract?.milestones && project.contract.milestones.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Milestones</p>
                    <div className="space-y-1.5">
                      {project.contract.milestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-sm">
                          {MILESTONE_ICONS[m.status] ?? <Circle size={14} />}
                          <span className="flex-1 min-w-0 text-gray-700 [overflow-wrap:anywhere]">{m.title}</span>
                          <span className="text-gray-400 text-xs">S/ {Number(m.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!project.contract && (
                  <p className="text-xs text-gray-400 mt-2">
                    El contrato se generará cuando aceptes una propuesta.
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* DEVELOPER view */}
      {!isCompany && (
        <div className="space-y-4">
          {devProposals.map((proposal) => {
            const project = proposal.project as ProjectWithContract | undefined;
            return (
              <Link key={proposal.id} href={project?.contract ? `/dashboard/contracts/${project.contract.id}` : '#'} className="block">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 [overflow-wrap:anywhere]">{project?.title ?? 'Proyecto'}</p>
                      {project?.company && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{project.company.name}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Acordado: <span className="font-medium">S/ {Number(proposal.budget).toLocaleString()}</span>
                        {' · '} {proposal.timeline} días
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 text-green-700">
                        Aceptada
                      </span>
                    </div>
                  </div>
                  {project?.contract?.milestones && project.contract.milestones.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">Progreso</p>
                        <p className="text-xs text-gray-400">
                          {project.contract.milestones.filter(m => m.status === 'PAID').length}/{project.contract.milestones.length}
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-primary-400 to-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.max(project.contract.milestones.filter(m => m.status === 'PAID').length / project.contract.milestones.length * 100, project.contract.milestones.some(m => ['IN_PROGRESS','SUBMITTED','REVISION_REQUESTED','APPROVED'].includes(m.status)) ? 5 : 0)}%` }}
                        />
                      </div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {project.contract.milestones.map((m) => (
                          <span key={m.id} className={`w-2 h-2 rounded-full ${
                            m.status === 'PAID' ? 'bg-emerald-500' :
                            m.status === 'IN_PROGRESS' ? 'bg-blue-400' :
                            m.status === 'SUBMITTED' ? 'bg-yellow-400' :
                            m.status === 'REVISION_REQUESTED' ? 'bg-orange-400' :
                            'bg-gray-200'
                          }`} title={m.title} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
