'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock, DollarSign, Users, Star, Search, SlidersHorizontal,
  ChevronDown, X, Sparkles, TrendingUp, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { usePublicProjects } from '@/hooks/use-projects';

const CATEGORIES = ['Web', 'Mobile', 'E-commerce', 'SaaS', 'API / Backend', 'Data / Analytics', 'Diseño UI/UX', 'Otro'];
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Más recientes' },
  { value: 'budget_desc', label: 'Mayor presupuesto' },
  { value: 'budget_asc',  label: 'Menor presupuesto' },
  { value: 'proposals',   label: 'Más propuestas' },
];

function isNewProject(createdAt?: string) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 48;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: projects = [], isLoading } = usePublicProjects();

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState('newest');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setCategories([]);
    setBudgetMin('');
    setBudgetMax('');
    setOnlyVerified(false);
    setSearch('');
  };

  const activeFilterCount = categories.length + (budgetMin ? 1 : 0) + (budgetMax ? 1 : 0) + (onlyVerified ? 1 : 0);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q));
      const matchCat = categories.length === 0 || categories.includes(p.category ?? '');
      const budget = Number(p.budget);
      const matchMin = !budgetMin || budget >= Number(budgetMin);
      const matchMax = !budgetMax || budget <= Number(budgetMax);
      const matchVerified = !onlyVerified || (p.company as { verified?: boolean }).verified;
      return matchSearch && matchCat && matchMin && matchMax && matchVerified;
    });

    if (sort === 'budget_desc') list = [...list].sort((a, b) => Number(b.budget) - Number(a.budget));
    else if (sort === 'budget_asc') list = [...list].sort((a, b) => Number(a.budget) - Number(b.budget));
    else if (sort === 'proposals') list = [...list].sort((a, b) => (b._count?.proposals ?? 0) - (a._count?.proposals ?? 0));
    // newest: default API order

    return list;
  }, [projects, search, categories, budgetMin, budgetMax, onlyVerified, sort]);

  const featured = useMemo(() =>
    projects.filter((p) => (p._count?.proposals ?? 0) === 0 && Number(p.budget) > 2000).slice(0, 3),
  [projects]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">

        {/* ── Header row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Proyectos disponibles</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? '…' : `${projects.length} proyectos abiertos`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:max-w-sm">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proyectos o tecnologías..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 space-y-4">
            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categoría</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      categories.includes(cat)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              {/* Budget range */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Presupuesto (USD)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" placeholder="Mín"
                    value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input
                    type="number" min="0" placeholder="Máx"
                    value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-24 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Verified only */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Empresa</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Solo verificadas</span>
                </label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer">
                <X size={11} />Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* ── Sort + count bar ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Cargando...' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
            {activeFilterCount > 0 && <span className="text-primary-600"> · filtros activos</span>}
          </p>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-gray-400" />
            <select
              value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-sm border-0 bg-transparent text-gray-600 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Featured strip (no proposals yet + high budget) ── */}
        {!isLoading && featured.length > 0 && !search && categories.length === 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sin propuestas aún · sé el primero</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featured.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-md hover:border-amber-300 transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold shrink-0">
                      {p.company.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-500 truncate">{p.company.name}</span>
                    {(p.company as { verified?: boolean }).verified && <span className="text-[10px] text-green-600 shrink-0">✓</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-primary-700">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <DollarSign size={11} />${Number(p.budget).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron proyectos con esos criterios.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-xs text-primary-600 hover:underline cursor-pointer">
                Limpiar filtros →
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((project) => {
            const isNew = isNewProject((project as { createdAt?: string }).createdAt);
            const companyVerified = (project.company as { verified?: boolean }).verified;
            const clientRating = (project.company as { clientRating?: number }).clientRating ?? 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col hover:shadow-md hover:border-primary-200 transition-all group"
              >
                {/* Company row */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                    {project.company.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/companies/${project.company.id}`} onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-gray-700 hover:text-primary-600 truncate block">
                      {project.company.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {companyVerified && <span className="text-[10px] text-green-600 font-medium">✓</span>}
                    {clientRating > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-yellow-600">
                        <Star size={9} className="fill-yellow-400 text-yellow-400" />
                        {clientRating.toFixed(1)}
                      </span>
                    )}
                    {isNew && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">NUEVO</span>
                    )}
                  </div>
                </div>

                {/* Category chip */}
                {project.category && (
                  <span className="self-start text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium mb-2">
                    {project.category}
                  </span>
                )}

                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-primary-700">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
                  {project.description}
                </p>

                {/* Skills */}
                {project.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.skills.slice(0, 3).map((s) => (
                      <span key={s} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{s}</span>
                    ))}
                    {project.skills.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{project.skills.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3">
                  <span className="flex items-center gap-0.5 text-gray-700 font-semibold">
                    <DollarSign size={11} />${Number(project.budget).toLocaleString()}
                  </span>
                  {project._count !== undefined && (
                    <span className="flex items-center gap-0.5">
                      <Users size={11} />{project._count.proposals}
                    </span>
                  )}
                  {project.deadline && (
                    <span className="flex items-center gap-0.5 ml-auto">
                      <Clock size={11} />
                      {new Date(project.deadline).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="w-full rounded-lg bg-primary-600 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors cursor-pointer"
                >
                  {user?.role === 'COMPANY' ? 'Ver detalle' : 'Ver y postular →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
