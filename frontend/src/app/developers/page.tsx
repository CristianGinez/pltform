'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Star, Trophy, Zap, TrendingUp, Users } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { DevCard } from '@/components/ui/dev-card';
import { usePublicDevelopers } from '@/hooks/use-developers';

const ALL_SKILLS = [
  'React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'React Native',
  'PostgreSQL', 'AWS', 'Vue.js', 'Laravel', 'Django', 'Flutter',
  'Docker', 'GraphQL', 'MongoDB', 'Firebase',
];

const SORT_OPTIONS = [
  { value: 'default',   label: 'Relevancia' },
  { value: 'rating',    label: 'Mejor calificados' },
  { value: 'trust',     label: 'Mayor confianza' },
  { value: 'rate_asc',  label: 'Menor tarifa' },
  { value: 'rate_desc', label: 'Mayor tarifa' },
];

export default function DevelopersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: devPages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicDevelopers({ search: debouncedSearch || undefined });

  const developers = useMemo(
    () => devPages?.pages.flatMap((p) => p.data) ?? [],
    [devPages],
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sort, setSort] = useState('default');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggleSkill = (s: string) => {
    setSelectedSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setOnlyAvailable(false);
    setOnlyVerified(false);
    setSearch('');
  };

  const activeFilterCount = selectedSkills.length + (onlyAvailable ? 1 : 0) + (onlyVerified ? 1 : 0);

  const filtered = useMemo(() => {
    let list = developers.filter((d) => {
      const matchSearch = true; // Search is now server-side
      const matchSkills = selectedSkills.length === 0 ||
        selectedSkills.some((s) => d.skills.some((ds) => ds.toLowerCase().includes(s.toLowerCase())));
      const matchAvailable = !onlyAvailable || d.available;
      const matchVerified = !onlyVerified || d.verified;
      return matchSearch && matchSkills && matchAvailable && matchVerified;
    });

    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === 'trust') list = [...list].sort((a, b) => (b.trustPoints ?? 0) - (a.trustPoints ?? 0));
    else if (sort === 'rate_asc') list = [...list].sort((a, b) => Number(a.hourlyRate ?? 9999) - Number(b.hourlyRate ?? 9999));
    else if (sort === 'rate_desc') list = [...list].sort((a, b) => Number(b.hourlyRate ?? 0) - Number(a.hourlyRate ?? 0));

    return list;
  }, [developers, selectedSkills, onlyAvailable, onlyVerified, sort]);

  // Top recommended: verified + high rating + available
  const recommended = useMemo(() =>
    developers
      .filter((d) => d.verified && (d.rating ?? 0) >= 4.5 && d.available)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 4),
  [developers]);

  const mapDev = (dev: typeof developers[0]) => ({
    id:              dev.id,
    name:            dev.name,
    avatarUrl:       dev.avatarUrl,
    available:       dev.available,
    verified:        dev.verified ?? false,
    university:      dev.university,
    rating:          dev.rating,
    reviewCount:     dev.reviewCount,
    trustPoints:     dev.trustPoints ?? 0,
    skills:          dev.skills,
    specialtyBadges: dev.specialtyBadges ?? [],
    location:        dev.location,
    hourlyRate:      dev.hourlyRate,
    warrantyDays:    dev.warrantyDays,
    bio:             dev.bio,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">

        {/* ── Header row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Directorio de desarrolladores</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? '…' : `${developers.length} desarrolladores disponibles`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:max-w-sm">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, skill o descripción..."
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
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tecnologías</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SKILLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      selectedSkills.includes(s)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Disponibilidad</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Solo disponibles ahora</span>
                </label>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Verificación</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">Solo verificados</span>
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

        {/* ── Recommended strip ── */}
        {!isLoading && recommended.length > 0 && !search && selectedSkills.length === 0 && (
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recomendados · mejor calificados y disponibles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommended.map((dev) => (
                <DevCard key={dev.id} d={mapDev(dev)} />
              ))}
            </div>
            <div className="mt-4 border-t border-gray-200" />
          </div>
        )}

        {/* ── Sort + count bar ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Cargando...' : `${filtered.length} desarrollador${filtered.length !== 1 ? 'es' : ''}`}
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

        {/* ── Grid ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-52 bg-white rounded-2xl border-2 border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron desarrolladores con esos criterios.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-xs text-primary-600 hover:underline cursor-pointer">
                Limpiar filtros →
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((dev) => (
            <DevCard key={dev.id} d={mapDev(dev)} />
          ))}
        </div>

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-2.5 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más desarrolladores'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
