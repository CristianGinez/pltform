'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import {
  ArrowLeft, Clock, DollarSign, Users, CheckCircle, Pencil, X, Plus,
  Star, Github, Globe, MapPin, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useProject, usePublishProject, useAcceptProposal, useUpdateProject } from '@/hooks/use-projects';
import { useSubmitProposal } from '@/hooks/use-proposals';
import { proposalSchema, type ProposalFormData } from '@/schemas/proposal.schema';
import { projectSchema, type ProjectFormData } from '@/schemas/project.schema';
import type { Proposal } from '@/types';

const CATEGORIES = ['Web', 'Mobile', 'E-commerce', 'SaaS', 'API / Backend', 'Data / Analytics', 'Automatización', 'Diseño UI/UX', 'Otro'];

// ─── Proposal detail drawer ───────────────────────────────────────────────────

type ProposalWithDev = Proposal & {
  developer?: {
    name: string; avatarUrl?: string | null; bio?: string | null; skills: string[];
    rating: number; reviewCount: number; hourlyRate?: number | null;
    githubUrl?: string | null; portfolioUrl?: string | null; location?: string | null;
    university?: string | null; trustPoints: number;
  };
};

function ProposalDetailDrawer({
  proposal, projectId, projectStatus, onClose,
}: {
  proposal: ProposalWithDev;
  projectId: string;
  projectStatus: string;
  onClose: () => void;
}) {
  const acceptProposal = useAcceptProposal(projectId);
  const dev = proposal.developer;

  const handleAccept = () => {
    acceptProposal.mutate(proposal.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-900">Detalle de propuesta</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Developer profile */}
          {dev && (
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
                {dev.avatarUrl
                  ? <img src={dev.avatarUrl} alt={dev.name} className="w-full h-full object-cover" />
                  : <span className="text-violet-700 font-bold text-lg">{dev.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{dev.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  {dev.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      {dev.rating.toFixed(1)} ({dev.reviewCount} reseñas)
                    </span>
                  )}
                  {dev.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={11} /> {dev.location}
                    </span>
                  )}
                  {dev.university && (
                    <span className="text-xs text-gray-400">{dev.university}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-1.5">
                  {dev.githubUrl && (
                    <a href={dev.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                      <Github size={12} /> GitHub
                    </a>
                  )}
                  {dev.portfolioUrl && (
                    <a href={dev.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                      <Globe size={12} /> Portafolio
                    </a>
                  )}
                </div>
              </div>
              {dev.trustPoints > 0 && (
                <div className="text-center shrink-0">
                  <p className="text-lg font-bold text-primary-600">{dev.trustPoints}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">Trust<br/>Points</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {dev && dev.skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Habilidades</p>
              <div className="flex flex-wrap gap-1.5">
                {dev.skills.map((s) => (
                  <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {dev?.bio && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Sobre el developer</p>
              <p className="text-sm text-gray-600 leading-relaxed">{dev.bio}</p>
            </div>
          )}

          {/* Propuesta económica */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">S/ {Number(proposal.budget).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Presupuesto propuesto</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{proposal.timeline} días</p>
              <p className="text-xs text-gray-400 mt-0.5">Tiempo estimado</p>
            </div>
          </div>

          {/* Cover letter */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Carta de presentación</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{proposal.coverLetter}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Enviada el {new Date(proposal.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Footer actions */}
        {proposal.status === 'PENDING' && projectStatus === 'OPEN' && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleAccept}
              disabled={acceptProposal.isPending}
              className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={15} />
              {acceptProposal.isPending ? 'Aceptando...' : 'Aceptar propuesta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};
const PROPOSAL_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithDev | null>(null);

  const { data: project, isLoading } = useProject(id);
  const publishProject = usePublishProject(id);
  const updateProject = useUpdateProject(id);
  const acceptProposal = useAcceptProposal(id);
  const [editMode, setEditMode] = useState(false);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [editSaved, setEditSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ProposalFormData>({ resolver: zodResolver(proposalSchema) });

  const submitProposal = useSubmitProposal(id);

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });

  const openEdit = () => {
    if (!project) return;
    resetEdit({
      title:       project.title,
      description: project.description,
      budget:      project.budget,
      deadline:    project.deadline ? project.deadline.slice(0, 10) : '',
      category:    project.category ?? '',
    });
    setEditSkills([...project.skills]);
    setEditSaved(false);
    setEditMode(true);
  };

  const handleSaveEdit = (data: ProjectFormData) =>
    updateProject.mutateAsync({ ...data, skills: editSkills })
      .then(() => { setEditMode(false); setEditSaved(true); setTimeout(() => setEditSaved(false), 3000); });

  const addEditSkill = () => {
    const s = skillInput.trim();
    if (s && !editSkills.includes(s)) setEditSkills((p) => [...p, s]);
    setSkillInput('');
  };

  const handleSubmitProposal = (data: ProposalFormData) =>
    submitProposal.mutateAsync(data).then(() => reset()).catch((err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al enviar la propuesta';
      setError('root', { message: msg });
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-gray-400">
        Proyecto no encontrado.{' '}
        <Link href="/dashboard/projects" className="text-primary-600 hover:underline">
          Volver
        </Link>
      </div>
    );
  }

  const projectAccepted = project.status === 'IN_PROGRESS' || project.status === 'COMPLETED';

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                {project.company.name.charAt(0)}
              </div>
              <span className="text-sm text-gray-500">{project.company.name}</span>
              {project.company.verified && (
                <span className="text-xs text-green-600">✓ Verificada</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
              project.status === 'OPEN' ? 'bg-green-50 text-green-700' :
              project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
              project.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
              'bg-gray-100 text-gray-500'
            }`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <DollarSign size={14} /> ${Number(project.budget).toLocaleString()}
          </span>
          {project.deadline && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              Fecha límite: {new Date(project.deadline).toLocaleDateString('es')}
            </span>
          )}
          {project._count && (
            <span className="flex items-center gap-1.5">
              <Users size={14} /> {project._count.proposals} propuesta{project._count.proposals !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {project.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {project.skills.map((s) => (
              <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {project.description}
          </p>
        </div>

        {user?.role === 'COMPANY' && project.status === 'DRAFT' && (
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            {editSaved && (
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle size={14} /> Cambios guardados correctamente.
              </p>
            )}

            {!editMode ? (
              <div className="flex gap-3">
                <button
                  onClick={() => publishProject.mutate()}
                  disabled={publishProject.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {publishProject.isPending ? 'Publicando...' : 'Publicar proyecto'}
                </button>
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={13} /> Editar borrador
                </button>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit(handleSaveEdit)} className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-700">Editar proyecto</p>
                  <button type="button" onClick={() => setEditMode(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                  <input {...regEdit('title')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
                  {editErrors.title && <p className="mt-1 text-xs text-red-500">{editErrors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <textarea {...regEdit('description')} rows={4}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
                  {editErrors.description && <p className="mt-1 text-xs text-red-500">{editErrors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Presupuesto (USD)</label>
                    <input {...regEdit('budget')} type="number" min="1"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
                    {editErrors.budget && <p className="mt-1 text-xs text-red-500">{editErrors.budget.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fecha límite</label>
                    <input {...regEdit('deadline')} type="date"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                  <select {...regEdit('category')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm">
                    <option value="">Sin categoría</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tecnologías</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {editSkills.map((s) => (
                      <span key={s} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                        {s}
                        <button type="button" onClick={() => setEditSkills(editSkills.filter((x) => x !== s))}>
                          <X size={10} className="hover:text-primary-900" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditSkill())}
                      placeholder="Agregar tecnología…"
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    />
                    <button type="button" onClick={addEditSkill}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                      <Plus size={13} /> Agregar
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={updateProject.isPending}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {updateProject.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* COMPANY: propuestas */}
      {user?.role === 'COMPANY' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Propuestas recibidas ({project.proposals?.length ?? 0})
          </h2>

          {(!project.proposals || project.proposals.length === 0) && (
            <p className="text-sm text-gray-400 py-4 text-center">
              Aún no hay propuestas. Cuando el proyecto esté abierto los developers podrán postular.
            </p>
          )}

          <div className="space-y-3">
            {project.proposals?.map((proposal) => {
              const dev = proposal.developer as ProposalWithDev['developer'];
              return (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal as ProposalWithDev)}
                  className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {dev?.avatarUrl
                        ? <img src={dev.avatarUrl} alt={dev.name} className="w-full h-full object-cover" />
                        : <span className="text-violet-700 font-semibold text-sm">{(dev?.name ?? 'D').charAt(0)}</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{dev?.name ?? 'Developer'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROPOSAL_COLORS[proposal.status]}`}>
                          {proposal.status === 'PENDING' ? 'Pendiente' : proposal.status === 'ACCEPTED' ? 'Aceptada' : proposal.status === 'REJECTED' ? 'Rechazada' : 'Retirada'}
                        </span>
                        {dev && dev.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            {dev.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{proposal.coverLetter}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>S/ {Number(proposal.budget).toLocaleString()}</span>
                        <span>{proposal.timeline} días</span>
                        {dev?.skills?.slice(0, 2).map((s) => (
                          <span key={s} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Proposal detail drawer */}
      {selectedProposal && (
        <ProposalDetailDrawer
          proposal={selectedProposal}
          projectId={id}
          projectStatus={project.status}
          onClose={() => setSelectedProposal(null)}
        />
      )}

      {/* DEVELOPER: formulario */}
      {user?.role === 'DEVELOPER' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {projectAccepted ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              Este proyecto ya no acepta propuestas.
            </div>
          ) : project.status !== 'OPEN' ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              Este proyecto no está abierto para propuestas aún.
            </div>
          ) : submitProposal.isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">¡Propuesta enviada!</p>
              <p className="text-sm text-gray-500 mt-1">La empresa revisará tu propuesta y te notificará.</p>
              <Link href="/dashboard/proposals" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
                Ver mis propuestas →
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900 mb-5">Enviar propuesta</h2>
              <form onSubmit={handleSubmit(handleSubmitProposal)} className="space-y-4">
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
                  className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Enviando...' : 'Enviar propuesta'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
