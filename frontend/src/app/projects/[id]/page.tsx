'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, DollarSign, Users, CheckCircle, XCircle, MinusCircle,
  MapPin, Building2, Globe, Calendar, Tag, Star, Send, RotateCcw, ListChecks,
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { useProject } from '@/hooks/use-projects';
import { useMyProposalForProject, useWithdrawProposal } from '@/hooks/use-proposals';
import { ProposalForm } from '@/features/proposals/components/ProposalForm';
import type { ProposalMilestone } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

export default function PublicProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: project, isLoading } = useProject(id);
  const existingProposal = useMyProposalForProject(id);
  const withdraw = useWithdrawProposal();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-32 text-gray-400">
          Proyecto no encontrado.{' '}
          <Link href="/projects" className="text-primary-600 hover:underline">Volver</Link>
        </div>
      </div>
    );
  }

  const isOpen = project.status === 'OPEN';
  const isDeveloper = user?.role === 'DEVELOPER';
  const isCompany = user?.role === 'COMPANY';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Volver a proyectos
        </button>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Project detail ── */}
          <div className="flex-1 min-w-0 space-y-5">

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {project.category && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full mb-2">
                      <Tag size={10} /> {project.category}
                    </span>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{project.title}</h1>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap shrink-0 ${
                  project.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                  project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                  project.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
                <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <DollarSign size={15} className="text-gray-400" />
                  S/ {Number(project.budget).toLocaleString()}
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Fecha límite: {new Date(project.deadline).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {project._count?.proposals ?? 0} propuesta{(project._count?.proposals ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {project.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.skills.map((s) => (
                    <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción del proyecto</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{project.description}</p>
              </div>
            </div>

            {/* --- SECCIÓN PARA POSTULAR --- */}
            {isDeveloper && existingProposal && existingProposal.status !== 'WITHDRAWN' ? (
              /* ── Propuesta ya enviada ── */
              <div className={`rounded-2xl border p-6 shadow-sm ${
                existingProposal.status === 'ACCEPTED' ? 'bg-green-50 border-green-200' :
                existingProposal.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
                'bg-white border-gray-100'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    {existingProposal.status === 'ACCEPTED' && <CheckCircle size={20} className="text-green-600 shrink-0" />}
                    {existingProposal.status === 'REJECTED' && <XCircle size={20} className="text-red-500 shrink-0" />}
                    {existingProposal.status === 'PENDING' && <Clock size={20} className="text-yellow-500 shrink-0" />}
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {existingProposal.status === 'ACCEPTED' && 'Propuesta aceptada'}
                        {existingProposal.status === 'REJECTED' && 'Propuesta rechazada'}
                        {existingProposal.status === 'PENDING' && 'Propuesta enviada'}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {new Date(existingProposal.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    existingProposal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    existingProposal.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {existingProposal.status === 'ACCEPTED' ? 'Aceptada' :
                     existingProposal.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>

                {/* Carta de presentación */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Carta de presentación</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] bg-white/70 rounded-xl px-4 py-3 border border-gray-100">
                    {existingProposal.coverLetter}
                  </p>
                </div>

                {/* Budget + Timeline */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/70 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Presupuesto</p>
                    <p className="text-sm font-bold text-gray-900">S/ {Number(existingProposal.budget).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Tiempo estimado</p>
                    <p className="text-sm font-bold text-gray-900">{existingProposal.timeline} días</p>
                  </div>
                </div>

                {/* Milestone plan */}
                {existingProposal.milestonePlan && existingProposal.milestonePlan.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ListChecks size={13} className="text-primary-600" />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan de tareas</p>
                    </div>
                    <div className="space-y-2">
                      {(existingProposal.milestonePlan as ProposalMilestone[]).map((m, i) => (
                        <div key={i} className="bg-white/70 rounded-xl px-4 py-3 border border-gray-100 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 [overflow-wrap:anywhere]">{m.title}</p>
                            {m.description && <p className="text-xs text-gray-400 mt-0.5 [overflow-wrap:anywhere]">{m.description}</p>}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/60">
                  {existingProposal.status === 'ACCEPTED' && (
                    <Link
                      href="/dashboard/proposals"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={14} /> Ver en mis propuestas
                    </Link>
                  )}
                  {existingProposal.status === 'PENDING' && (
                    <button
                      onClick={() => withdraw.mutate(existingProposal.id)}
                      disabled={withdraw.isPending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <MinusCircle size={14} /> Retirar propuesta
                    </button>
                  )}
                  {existingProposal.status === 'REJECTED' && (
                    <p className="text-xs text-red-400 italic">Esta propuesta fue rechazada. Puedes postular de nuevo si el proyecto sigue abierto.</p>
                  )}
                </div>
              </div>
            ) : isDeveloper && (existingProposal?.status === 'WITHDRAWN' || !existingProposal) && isOpen ? (
              /* ── Formulario de postulación ── */
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                {existingProposal?.status === 'WITHDRAWN' && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 mb-5">
                    <RotateCcw size={14} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500">Retiraste tu propuesta anterior. Puedes volver a postular.</p>
                  </div>
                )}
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Send size={16} className="text-primary-600" />
                    {existingProposal?.status === 'WITHDRAWN' ? 'Volver a postular' : 'Enviar propuesta'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Presenta tu candidatura con un plan detallado para aumentar tus posibilidades de ser seleccionado.</p>
                </div>
                <ProposalForm projectId={project.id} projectBudget={Number(project.budget)} />
              </div>
            ) : isDeveloper && !isOpen ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                Este proyecto ya no está abierto para nuevas propuestas.
              </div>
            ) : !user && isOpen ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                <p className="text-gray-700 font-medium mb-3">¿Eres developer y te interesa este proyecto?</p>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                  Inicia sesión para postular
                </Link>
              </div>
            ) : isCompany && isOpen ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                Las empresas no pueden postular a proyectos.
              </div>
            ) : !isOpen && !isDeveloper ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                Este proyecto ya no está abierto para nuevas propuestas.
              </div>
            ) : null}
          </div>

          {/* ── RIGHT: Company card ── */}
          <div className="w-full lg:w-72 shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Publicado por</p>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                {(project.company as { logoUrl?: string }).logoUrl ? (
                  <img
                    src={(project.company as { logoUrl?: string }).logoUrl}
                    alt={project.company.name}
                    className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {project.company.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/companies/${project.companyId}`} className="font-bold text-gray-900 text-sm truncate hover:text-blue-700 transition-colors">
                      {project.company.name}
                    </Link>
                    {project.company.verified && (
                      <CheckCircle size={14} className="text-blue-500 shrink-0" fill="currentColor" />
                    )}
                  </div>
                  {(project.company as { industry?: string }).industry && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                      {(project.company as { industry?: string }).industry}
                    </span>
                  )}
                  {((project.company as { clientRating?: number; clientReviewCount?: number }).clientRating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-yellow-600 font-medium">
                        {(project.company as { clientRating?: number }).clientRating?.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({(project.company as { clientReviewCount?: number }).clientReviewCount} reseña{(project.company as { clientReviewCount?: number }).clientReviewCount !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {(project.company as { description?: string }).description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-3">
                  {(project.company as { description?: string }).description}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-gray-500">
                {project.company.location && (
                  <div className="flex items-center gap-1.5"><MapPin size={11} />{project.company.location}</div>
                )}
                {(project.company as { website?: string }).website && (
                  <a
                    href={(project.company as { website?: string }).website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-600 hover:underline"
                  >
                    <Globe size={11} /> Sitio web
                  </a>
                )}
                {(project.company as { size?: string }).size && (
                  <div className="flex items-center gap-1.5"><Building2 size={11} />{(project.company as { size?: string }).size} empleados</div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock size={11} />
                  Publicado {new Date(project.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Users size={13} /> Postulantes</span>
                <span className="font-bold text-gray-900">{project._count?.proposals ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500 flex items-center gap-1.5"><DollarSign size={13} /> Presupuesto</span>
                <span className="font-bold text-gray-900">S/ {Number(project.budget).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
