'use client';

import { useState } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { DevCard } from '@/components/ui/dev-card';
import { usePublicDevelopers } from '@/hooks/use-developers';
import type { Developer } from '@/types';

const SKILLS = ['Todos', 'React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'React Native', 'PostgreSQL', 'AWS'];

export default function DevelopersPage() {
  const [skill, setSkill] = useState('');
  const [search, setSearch] = useState('');

  const { data: developers = [], isLoading } = usePublicDevelopers(skill || undefined);

  const filtered = developers.filter((d) => {
    if (!search) return true;
    return (
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      d.bio?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Directorio de desarrolladores</h1>
          <p className="mt-2 text-gray-500">Encuentra el talento digital para tu próximo proyecto.</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, skills o descripción..."
            className="w-full max-w-md rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Skill filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s === 'Todos' ? '' : s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (s === 'Todos' && !skill) || skill === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 bg-white rounded-2xl border-2 border-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No se encontraron desarrolladores con esos criterios.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dev) => (
            <DevCard
              key={dev.id}
              d={{
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
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
