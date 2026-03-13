'use client';

import Link from 'next/link';
import { useMyProposals, useWithdrawProposal } from '@/hooks/use-proposals';
import type { Proposal } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Retirada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function ProposalsPage() {
  const { data: proposals = [], isLoading } = useMyProposals();
  const withdraw = useWithdrawProposal();

  return (
    <div>
      <div className="mb-8">
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
          <Link
            href="/projects"
            className="mt-3 inline-block text-sm text-primary-600 hover:underline"
          >
            Explorar proyectos disponibles →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {proposals.map((proposal: Proposal) => {
          const project = proposal.project as (typeof proposal.project & { company?: { name?: string }; contract?: { id: string } });
          const contractId = project?.contract?.id;
          return (
            <div
              key={proposal.id}
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/projects/${proposal.projectId}`}
                      className="font-medium text-gray-900 hover:text-primary-700 transition-colors truncate max-w-xs"
                    >
                      {project?.title ?? 'Proyecto'}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[proposal.status]}`}>
                      {STATUS_LABELS[proposal.status]}
                    </span>
                  </div>

                  {project?.company && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {project.company.name}
                    </p>
                  )}

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{proposal.coverLetter}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                    <span>Presupuesto: <span className="text-gray-700">S/ {Number(proposal.budget).toLocaleString()}</span></span>
                    <span>Plazo: <span className="text-gray-700">{proposal.timeline} días</span></span>
                    <span>{new Date(proposal.createdAt).toLocaleDateString('es')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
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
                      onClick={() => withdraw.mutate(proposal.id)}
                      disabled={withdraw.isPending}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                    >
                      Retirar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
