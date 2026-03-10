'use client';

import Link from 'next/link';
import { Plus, Clock, DollarSign, Users, ChevronRight, FolderOpen } from 'lucide-react';
import { useMyProjects } from '@/hooks/use-projects';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-red-50 text-red-600',
};

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useMyProjects();

  return (
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8 flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tus proyectos y recibe propuestas de developers.</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <Plus size={15} />
          Nuevo proyecto
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
          <FolderOpen size={40} className="text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">No tienes proyectos todavía.</p>
          <Link
            href="/dashboard/projects/new"
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Crear tu primer proyecto →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  {p.category && <span className="text-xs text-gray-400">{p.category}</span>}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <DollarSign size={13} />${Number(p.budget).toLocaleString()}
                </span>
                {p._count !== undefined && (
                  <span className="hidden sm:flex items-center gap-1">
                    <Users size={13} />{p._count.proposals} propuesta{p._count.proposals !== 1 ? 's' : ''}
                  </span>
                )}
                <ChevronRight size={15} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
            {p.deadline && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={11} />
                Fecha límite: {new Date(p.deadline).toLocaleDateString('es-PE')}
              </p>
            )}
            {p.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.skills.slice(0, 4).map((s) => (
                  <span key={s} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {p.skills.length > 4 && (
                  <span className="text-xs text-gray-400">+{p.skills.length - 4}</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
