'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, FileEdit, Globe, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProjects } from '@/hooks/use-projects';
import { DashboardProjectCard } from './DashboardProjectCard';
import type { Project } from '@/types';

type ProjectStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const TAB_ORDER: ProjectStatus[] = ['OPEN', 'IN_PROGRESS', 'DRAFT', 'COMPLETED', 'CANCELLED'];

const TAB_CONFIG: Record<ProjectStatus, { label: string; icon: React.ReactNode; activeText: string; activeBorder: string }> = {
  OPEN:        { label: 'Abiertos',      icon: <Globe size={12} />,        activeText: 'text-green-600',   activeBorder: 'border-green-500'  },
  IN_PROGRESS: { label: 'En progreso',   icon: <Zap size={12} />,          activeText: 'text-blue-600',    activeBorder: 'border-blue-500'   },
  DRAFT:       { label: 'Borradores',    icon: <FileEdit size={12} />,     activeText: 'text-gray-600',    activeBorder: 'border-gray-400'   },
  COMPLETED:   { label: 'Completados',   icon: <CheckCircle size={12} />,  activeText: 'text-purple-600',  activeBorder: 'border-purple-500' },
  CANCELLED:   { label: 'Cancelados',    icon: <XCircle size={12} />,      activeText: 'text-red-500',     activeBorder: 'border-red-400'    },
};

export function DashboardProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isCompany = user?.role === 'COMPANY';

  const { data: projects = [], isLoading } = useMyProjects(isCompany);
  const [activeTab, setActiveTab] = useState<ProjectStatus>('OPEN');

  useEffect(() => {
    if (user && !isCompany) router.replace('/dashboard');
  }, [user, isCompany, router]);

  if (!isCompany) return null;

  const groups = TAB_ORDER.reduce<Record<ProjectStatus, Project[]>>(
    (acc, s) => ({ ...acc, [s]: projects.filter((p) => p.status === s) }),
    {} as Record<ProjectStatus, Project[]>,
  );

  // Auto-select first non-empty tab on load
  const firstNonEmpty = TAB_ORDER.find((s) => groups[s].length > 0);
  const tab = groups[activeTab].length === 0 && firstNonEmpty && activeTab === 'OPEN' && !projects.some((p) => p.status === 'OPEN')
    ? firstNonEmpty
    : activeTab;

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

      {!isLoading && projects.length > 0 && (
        <>
          {/* Tabs */}
          <div className="relative mb-6">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex border-b border-gray-200">
                {TAB_ORDER.map((status) => {
                  const cfg = TAB_CONFIG[status];
                  const count = groups[status].length;
                  const isSelected = tab === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setActiveTab(status)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                        isSelected
                          ? `${cfg.activeText} ${cfg.activeBorder}`
                          : 'text-gray-400 border-transparent hover:text-gray-500'
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                      <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none ${
                        isSelected ? 'bg-gray-100 ' + cfg.activeText : 'bg-gray-100 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-gray-50 to-transparent" />
          </div>

          {/* List */}
          <div className="space-y-3 min-h-48">
            {groups[tab].length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-sm text-gray-400">No hay proyectos en esta sección.</p>
                {tab === 'OPEN' || tab === 'DRAFT' ? (
                  <Link href="/dashboard/projects/new" className="mt-2 text-sm text-primary-600 hover:underline">
                    Crear nuevo proyecto →
                  </Link>
                ) : null}
              </div>
            ) : (
              groups[tab].map((p) => (
                <DashboardProjectCard key={p.id} project={p} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
