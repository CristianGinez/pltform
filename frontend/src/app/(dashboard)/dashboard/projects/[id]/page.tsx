'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, DollarSign, Users, Tag, Edit, Send, PlayCircle
} from 'lucide-react';
import { useProject, usePublishProject } from '@/hooks/use-projects';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

export default function DashboardProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: project, isLoading } = useProject(id);
  const publishMutation = usePublishProject(id); // <-- Hook conectado correctamente

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-32 text-gray-400">
        Proyecto no encontrado.{' '}
        <Link href="/dashboard/projects" className="text-primary-600 hover:underline">
          Volver a mis proyectos
        </Link>
      </div>
    );
  }

  // Función para manejar el botón de "Publicar"
  const handlePublish = () => {
    if (confirm('¿Estás seguro de publicar este proyecto? Una vez publicado, los developers podrán enviar sus propuestas.')) {
      publishMutation.mutate();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <button
        onClick={() => router.push('/dashboard/projects')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Volver a mis proyectos
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── IZQUIERDA: Detalles del Proyecto ── */}
        <div className="flex-1 min-w-0 space-y-5 w-full">
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
                {STATUS_LABELS[project.status] || project.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                <DollarSign size={15} className="text-gray-400" />
                ${Number(project.budget).toLocaleString()}
              </span>
              {project.deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Fecha límite: {new Date(project.deadline).toLocaleDateString('es-PE')}
                </span>
              )}
            </div>

            {project.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {project.skills.map((s: string) => (
                  <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción del proyecto</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          </div>
        </div>

        {/* ── DERECHA: Acciones (Editar/Publicar) y Estadísticas ── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Acciones del Proyecto</h3>
            
            <div className="space-y-3">
              {project.status === 'DRAFT' && (
                <>
                  <button 
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {publishMutation.isPending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Publicar Proyecto
                  </button>
                  <Link href={`/dashboard/projects/${project.id}/edit`} className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Edit size={15} /> Editar Borrador
                  </Link>
                </>
              )}

              {project.status === 'OPEN' && (
                <Link href="/dashboard/proposals" className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors cursor-pointer">
                  <Users size={15} /> Ver Propuestas ({project._count?.proposals || 0})
                </Link>
              )}

              {project.status === 'IN_PROGRESS' && project.contract && (
                <Link href={`/dashboard/contracts/${project.contract.id}`} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">
                  <PlayCircle size={15} /> Ir al Contrato
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Users size={14} /> Postulantes</span>
                <span className="font-bold text-gray-900">{project._count?.proposals || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}