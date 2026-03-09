'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import {
  ArrowLeft, Clock, DollarSign, Users, CheckCircle, MapPin,
  Building2, Globe, Calendar, Tag, Send, Star,
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { useProject } from '@/hooks/use-projects';
import { useSubmitProposal } from '@/hooks/use-proposals';
import { proposalSchema, type ProposalFormData } from '@/schemas/proposal.schema';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

export default function PublicProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  const { data: project, isLoading } = useProject(id);
  const submitProposal = useSubmitProposal(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ProposalFormData>({ resolver: zodResolver(proposalSchema) });

  const handleApply = (data: ProposalFormData) =>
    submitProposal.mutateAsync(data)
      .then(() => reset())
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al enviar la propuesta';
        setError('root', { message: msg });
      });

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
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Volver a proyectos
        </button>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Project detail ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Header card */}
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
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                  project.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                  project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                  project.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
                <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <DollarSign size={15} className="text-gray-400" />
                  ${Number(project.budget).toLocaleString()}
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

              {/* Skills */}
              {project.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.skills.map((s) => (
                    <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción del proyecto</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>

            {/* Apply section */}
            {isOpen && isDeveloper && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                {submitProposal.isSuccess ? (
                  <div className="text-center py-6">
                    <CheckCircle size={44} className="text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900 text-lg">¡Propuesta enviada!</p>
                    <p className="text-sm text-gray-500 mt-1">La empresa revisará tu propuesta pronto.</p>
                    <Link href="/dashboard/proposals" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
                      Ver mis propuestas →
                    </Link>
                  </div>
                ) : !showForm ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">¿Te interesa este proyecto?</p>
                      <p className="text-sm text-gray-500 mt-0.5">Envía tu propuesta directamente a la empresa.</p>
                    </div>
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                    >
                      <Send size={14} /> Postular
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-semibold text-gray-900">Enviar propuesta</h2>
                      <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                    </div>
                    <form onSubmit={handleSubmit(handleApply)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Carta de presentación <span className="text-gray-400 font-normal">(mín. 100 caracteres)</span>
                        </label>
                        <textarea
                          {...register('coverLetter')}
                          rows={5}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                          placeholder="Describe tu experiencia relevante, cómo abordarías el proyecto y por qué eres el candidato ideal..."
                        />
                        {errors.coverLetter && <p className="mt-1 text-xs text-red-500">{errors.coverLetter.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto (USD)</label>
                          <input {...register('budget')} type="number" min="1"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            placeholder="4500" />
                          {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (días)</label>
                          <input {...register('timeline')} type="number" min="1"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                            placeholder="30" />
                          {errors.timeline && <p className="mt-1 text-xs text-red-500">{errors.timeline.message}</p>}
                        </div>
                      </div>

                      {errors.root && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{errors.root.message}</p>
                      )}

                      <button type="submit" disabled={isSubmitting}
                        className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {isSubmitting
                          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                          : <><Send size={14} /> Enviar propuesta</>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {isOpen && !user && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
                <p className="text-gray-700 font-medium mb-3">¿Eres developer y te interesa este proyecto?</p>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                  Inicia sesión para postular
                </Link>
              </div>
            )}

            {isOpen && isCompany && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                Las empresas no pueden postular a proyectos.
              </div>
            )}

            {!isOpen && project.status !== 'DRAFT' && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center text-sm text-gray-400">
                Este proyecto ya no está abierto para nuevas propuestas.
              </div>
            )}
          </div>

          {/* ── RIGHT: Company card ── */}
          <div className="w-full lg:w-72 flex-shrink-0">
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {project.company.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/companies/${project.companyId}`} className="font-bold text-gray-900 text-sm truncate hover:text-blue-700 transition-colors">
                      {project.company.name}
                    </Link>
                    {project.company.verified && (
                      <CheckCircle size={14} className="text-blue-500 flex-shrink-0" fill="currentColor" />
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

              {/* Posted date */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock size={11} />
                  Publicado {new Date(project.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Users size={13} /> Postulantes</span>
                <span className="font-bold text-gray-900">{project._count?.proposals ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500 flex items-center gap-1.5"><DollarSign size={13} /> Presupuesto</span>
                <span className="font-bold text-gray-900">${Number(project.budget).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
