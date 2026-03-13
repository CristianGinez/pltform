'use client';

import Link from 'next/link';
import { Clock, DollarSign, Users, ChevronRight } from 'lucide-react';
import type { Project } from '@/types';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../constants';

interface DashboardProjectCardProps {
  project: Project & { _count?: { proposals: number } };
}

export function DashboardProjectCard({ project: p }: DashboardProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${p.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-primary-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROJECT_STATUS_COLORS[p.status]}`}>
              {PROJECT_STATUS_LABELS[p.status]}
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
  );
}
