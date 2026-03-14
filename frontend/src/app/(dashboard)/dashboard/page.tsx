'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, ArrowRight, Send, CheckCircle, Clock, XCircle,
  Briefcase, Search, FileText, Star,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMyProjects } from '@/hooks/use-projects';
import { useMyProposals } from '@/hooks/use-proposals';
import type { Proposal } from '@/types';

const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};
const PROJECT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-red-50 text-red-500',
};
const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};
const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', WITHDRAWN: 'Retirada',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role === 'ADMIN') router.push('/dashboard/admin');
  }, [user, router]);

  if (user?.role === 'ADMIN') return null;

  const isCompany = user?.role === 'COMPANY';
  const { data: projects } = useMyProjects(isCompany);
  const { data: proposals = [] } = useMyProposals();

  // ── Company dashboard ──────────────────────────────────────────────────────
  if (isCompany) {
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Proyectos totales', value: projects?.length ?? 0 },
            { label: 'Proyectos activos', value: projects?.filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length ?? 0 },
            { label: 'Completados', value: projects?.filter((p) => p.status === 'COMPLETED').length ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

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
              <Link href="/dashboard/projects/new" className="text-primary-600 hover:underline">Crea el primero</Link>
            </p>
          )}
          {projects?.slice(0, 5).map((p) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`}
              className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">S/ {Number(p.budget).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${PROJECT_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {PROJECT_STATUS_LABELS[p.status] ?? p.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Developer dashboard ────────────────────────────────────────────────────
  const activeContracts = proposals.filter((p) => p.status === 'ACCEPTED');
  const pending = proposals.filter((p) => p.status === 'PENDING');
  const accepted = proposals.filter((p) => p.status === 'ACCEPTED');
  const rejected = proposals.filter((p) => p.status === 'REJECTED');

  const stats = [
    { label: 'Enviadas',      value: proposals.length,       icon: <Send size={16} />,         color: 'text-gray-600',    bg: 'bg-gray-50'       },
    { label: 'Pendientes',    value: pending.length,          icon: <Clock size={16} />,        color: 'text-yellow-600',  bg: 'bg-yellow-50'     },
    { label: 'Aceptadas',     value: accepted.length,         icon: <CheckCircle size={16} />,  color: 'text-green-600',   bg: 'bg-green-50'      },
    { label: 'Rechazadas',    value: rejected.length,         icon: <XCircle size={16} />,      color: 'text-red-500',     bg: 'bg-red-50'        },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Bienvenido de nuevo</p>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <Search size={15} />
          Explorar proyectos
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active contracts */}
      {activeContracts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-500" />
              Contratos activos
            </h2>
            <Link href="/dashboard/contracts" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {activeContracts.slice(0, 3).map((p: Proposal) => {
            const project = p.project as any;
            const contractId = project?.contract?.id;
            return (
              <Link key={p.id}
                href={contractId ? `/dashboard/contracts/${contractId}` : '/dashboard/contracts'}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{project?.title ?? 'Proyecto'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{project?.company?.name}</p>
                </div>
                <span className="text-xs font-semibold text-primary-700 shrink-0">
                  S/ {Number(p.budget).toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent proposals */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            Propuestas recientes
          </h2>
          <Link href="/dashboard/proposals" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        {proposals.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Aún no has enviado propuestas.</p>
            <Link href="/projects" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
              Explorar proyectos disponibles →
            </Link>
          </div>
        ) : (
          proposals.slice(0, 5).map((p: Proposal) => {
            const project = p.project as any;
            return (
              <Link key={p.id} href={`/dashboard/projects/${p.projectId}`}
                className="flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{project?.title ?? 'Proyecto'}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{project?.company?.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${PROPOSAL_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {PROPOSAL_STATUS_LABELS[p.status] ?? p.status}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/proposals"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Mis propuestas</p>
            <p className="text-xs text-gray-400">{pending.length} pendiente{pending.length !== 1 ? 's' : ''}</p>
          </div>
        </Link>
        <Link href="/dashboard/contracts"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Contratos</p>
            <p className="text-xs text-gray-400">{activeContracts.length} activo{activeContracts.length !== 1 ? 's' : ''}</p>
          </div>
        </Link>
        <Link href="/dashboard/profile"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Star size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Mi perfil</p>
            <p className="text-xs text-gray-400">Ver y editar</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
