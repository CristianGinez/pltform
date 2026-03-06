'use client';

import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProjects } from '@/hooks/use-projects';
import { useMyProposals } from '@/hooks/use-proposals';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projects } = useMyProjects();
  const { data: proposals } = useMyProposals();

  if (user?.role === 'COMPANY') {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Bienvenido de nuevo</p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} />
            Nuevo proyecto
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Proyectos totales', value: projects?.length ?? 0 },
            {
              label: 'Proyectos activos',
              value: projects?.filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length ?? 0,
            },
            {
              label: 'Completados',
              value: projects?.filter((p) => p.status === 'COMPLETED').length ?? 0,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Proyectos recientes</h2>
            <Link href="/dashboard/projects" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {projects?.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              No tienes proyectos aún.{' '}
              <Link href="/dashboard/projects/new" className="text-primary-600 hover:underline">
                Crea el primero
              </Link>
            </p>
          )}
          {projects?.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/projects/${p.id}`}
              className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">${p.budget.toLocaleString()}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.status === 'OPEN'
                    ? 'bg-green-50 text-green-700'
                    : p.status === 'IN_PROGRESS'
                    ? 'bg-blue-50 text-blue-700'
                    : p.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Developer dashboard
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Bienvenido de nuevo</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Propuestas enviadas', value: proposals?.length ?? 0 },
          {
            label: 'Aceptadas',
            value: proposals?.filter((p) => p.status === 'ACCEPTED').length ?? 0,
          },
          {
            label: 'Pendientes',
            value: proposals?.filter((p) => p.status === 'PENDING').length ?? 0,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Explorar proyectos
        </Link>
        <Link
          href="/dashboard/proposals"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Ver mis propuestas <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
