'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Star, MapPin, Globe, CheckCircle, Building2,
  Briefcase, Users, MessageSquare, ExternalLink, DollarSign,
  Calendar, TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useCompany } from '@/hooks/use-companies';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado',
  DRAFT: 'Borrador', CANCELLED: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-yellow-50 text-yellow-700',
  CANCELLED: 'bg-red-50 text-red-600',
};

function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size}
          className={s <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: company, isLoading } = useCompany(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-32 text-gray-400">
          Empresa no encontrada.{' '}
          <Link href="/projects" className="text-blue-600 hover:underline">Volver a proyectos</Link>
        </div>
      </div>
    );
  }

  const openProjects = company.projects.filter((p) => p.status === 'OPEN');
  const completedProjects = company.projects.filter((p) => p.status === 'COMPLETED');
  const reviews = company.user?.reviewsReceived ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={16} />
          Volver
        </button>

        {/* Hero banner */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-start gap-5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                company.name.charAt(0)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold">{company.name}</h1>
                {company.verified && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle size={11} className="fill-white" /> Verificada
                  </span>
                )}
              </div>

              {company.industry && (
                <p className="text-blue-200 text-sm mt-1">{company.industry}</p>
              )}

              <div className="flex items-center flex-wrap gap-3 mt-3 text-sm text-blue-100">
                {company.location && (
                  <span className="flex items-center gap-1"><MapPin size={13} />{company.location}</span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1"><Users size={13} />{company.size} empleados</span>
                )}
                {company.website && (
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe size={13} />{new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`).hostname}
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              icon: Star,
              label: 'Calificación',
              value: company.clientRating > 0 ? company.clientRating.toFixed(1) : '—',
              sub: `${company.clientReviewCount} reseña${company.clientReviewCount !== 1 ? 's' : ''}`,
              color: 'text-yellow-500',
              bg: 'bg-yellow-50',
            },
            {
              icon: Briefcase,
              label: 'Proyectos abiertos',
              value: openProjects.length,
              sub: 'disponibles',
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              icon: TrendingUp,
              label: 'Completados',
              value: completedProjects.length,
              sub: 'proyectos',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: MessageSquare,
              label: 'Reseñas',
              value: reviews.length,
              sub: 'de developers',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={15} className={s.color} />
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left / Main */}
          <div className="flex-1 space-y-5">

            {/* Description */}
            {company.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={15} className="text-blue-600" />
                  <h2 className="font-semibold text-gray-800 text-sm">Sobre la empresa</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{company.description}</p>
              </div>
            )}

            {/* Open projects */}
            {openProjects.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={15} className="text-green-600" />
                  <h2 className="font-semibold text-gray-800 text-sm">Proyectos abiertos</h2>
                  <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{openProjects.length}</span>
                </div>
                <div className="space-y-3">
                  {openProjects.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className="block rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {p.category && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mb-1.5 inline-block">{p.category}</span>
                          )}
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">{p.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                          {p.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.skills.slice(0, 4).map((s) => (
                                <span key={s} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-gray-400 shrink-0">
                          <span className="flex items-center gap-1 font-semibold text-gray-700"><DollarSign size={11} />S/ {Number(p.budget).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Users size={10} />{p._count.proposals} propuestas</span>
                          <ExternalLink size={12} className="mt-1 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star size={15} className="text-yellow-500" />
                <h2 className="font-semibold text-gray-800 text-sm">Reseñas de developers</h2>
                {reviews.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Aún no hay reseñas de developers para esta empresa.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => {
                    const devName = r.reviewer?.developer?.name ?? 'Developer';
                    const avatar = r.reviewer?.developer?.avatarUrl;
                    return (
                      <div key={r.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-semibold shrink-0 overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt={devName} className="w-full h-full object-cover" />
                          ) : (
                            devName.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-800">{devName}</span>
                            <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('es-PE')}</span>
                          </div>
                          <StarDisplay value={r.rating} size={13} />
                          {r.comment && (
                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">"{r.comment}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            {/* Rating card */}
            {company.clientRating > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                <StarDisplay value={company.clientRating} size={22} />
                <p className="text-3xl font-bold text-gray-900 mt-3">{company.clientRating.toFixed(1)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {company.clientReviewCount} reseña{company.clientReviewCount !== 1 ? 's' : ''} de developers
                </p>
              </div>
            )}

            {/* Company info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información</h3>
              {company.industry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Industria</span>
                  <span className="font-medium text-gray-800 text-right max-w-35 text-xs">{company.industry}</span>
                </div>
              )}
              {company.size && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Users size={13} /> Tamaño</span>
                  <span className="font-medium text-gray-800">{company.size} emp.</span>
                </div>
              )}
              {company.location && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><MapPin size={13} /> Ubicación</span>
                  <span className="font-medium text-gray-800 text-right text-xs max-w-30">{company.location}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Estado</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${company.verified ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {company.verified ? '✓ Verificada' : 'No verificada'}
                </span>
              </div>
              {company.website && (
                <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors pt-1">
                  <Globe size={13} />
                  <span className="truncate">Sitio web</span>
                  <ExternalLink size={11} className="ml-auto shrink-0" />
                </a>
              )}
            </div>

            {/* Completed count */}
            <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Proyectos completados</h3>
                <TrendingUp size={16} className="text-blue-300" />
              </div>
              <p className="text-3xl font-bold">{completedProjects.length}</p>
              <p className="text-xs text-blue-200 mt-1 leading-snug">
                Proyectos terminados exitosamente en la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
