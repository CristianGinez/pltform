'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProjects } from '@/hooks/use-projects';
import { DashboardProjectCard } from './DashboardProjectCard';

export function DashboardProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isCompany = user?.role === 'COMPANY';

  const { data: projects = [], isLoading } = useMyProjects(isCompany);

  useEffect(() => {
    if (user && !isCompany) router.replace('/dashboard');
  }, [user, isCompany, router]);

  if (!isCompany) return null;

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
          <Link href="/dashboard/projects/new" className="text-sm text-primary-600 hover:underline font-medium">
            Crear tu primer proyecto →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((p) => (
          <DashboardProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
