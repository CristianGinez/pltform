'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, DollarSign, Users, Star } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { usePublicProjects } from '@/hooks/use-projects';
import type { Project } from '@/types';

const CATEGORIES = ['Todos', 'Web', 'Mobile', 'E-commerce', 'SaaS', 'API / Backend', 'Data / Analytics', 'Diseño UI/UX', 'Otro'];

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = usePublicProjects();

  const filtered = projects.filter((p) => {
    const matchCat = category === 'Todos' || p.category === category;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleApply = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Proyectos disponibles</h1>
          <p className="mt-2 text-gray-500">Encuentra tu próximo proyecto y envía tu propuesta.</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción o tecnología..."
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No se encontraron proyectos con esos criterios.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col hover:shadow-md hover:border-primary-200 transition-all"
            >
              {/* Company */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                  {project.company.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <Link href={`/companies/${project.company.id}`} onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-gray-700 hover:text-primary-600 transition-colors line-clamp-1">
                    {project.company.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    {project.company.verified && (
                      <span className="text-xs text-green-600">✓ Verificada</span>
                    )}
                    {((project.company as { clientRating?: number }).clientRating ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        {(project.company as { clientRating?: number }).clientRating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
                {project.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                {project.description}
              </p>

              {/* Skills */}
              {project.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.skills.slice(0, 4).map((s) => (
                    <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                  {project.skills.length > 4 && (
                    <span className="text-xs text-gray-400">+{project.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />
                  ${Number(project.budget).toLocaleString()}
                </span>
                {project._count && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {project._count.proposals} propuesta{project._count.proposals !== 1 ? 's' : ''}
                  </span>
                )}
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(project.deadline).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleApply(project.id)}
                className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors cursor-pointer"
              >
                {user?.role === 'COMPANY' ? 'Ver detalle' : 'Postular'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
