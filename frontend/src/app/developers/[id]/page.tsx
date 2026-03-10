'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, MapPin, Globe, Github, Linkedin,
  DollarSign, Shield, GraduationCap, Star, Briefcase,
  ExternalLink, Tag, Building2, Clock, Pencil, AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { Tip, Stars, BADGES } from '@/components/ui/dev-card';
import { useDeveloper } from '@/hooks/use-developers';
import { useAuthStore } from '@/store/auth.store';
import { defaultAvatar } from '@/lib/avatar';

// ─── Skill pill ───────────────────────────────────────────────────────────────

function SkillPill({ label }: { label: string }) {
  return (
    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">{label}</span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = 'text-gray-700' }: {
  icon: React.ElementType; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex-1 min-w-20">
      <Icon size={16} className={`${color}`} />
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} className="text-primary-600" />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeveloperProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: dev, isLoading } = useDeveloper(id);
  const isOwner = !!user && dev?.userId === user.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!dev) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-32 text-gray-400">
          Developer no encontrado.{' '}
          <Link href="/developers" className="text-primary-600 hover:underline">Volver</Link>
        </div>
      </div>
    );
  }

  const initial = dev.name?.charAt(0)?.toUpperCase() ?? '?';
  const activeBadges = (dev.specialtyBadges ?? []).filter((b) => BADGES[b]);
  const completedWork = dev.proposals ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Cover + Header ── */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-40 bg-linear-to-br from-primary-600 via-primary-500 to-cyan-400" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 sm:left-6 flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Volver
        </button>

        {/* Edit button — only visible to profile owner */}
        {isOwner && (
          <Link
            href="/dashboard/profile"
            className="absolute top-4 right-4 sm:right-6 flex items-center gap-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
          >
            <Pencil size={13} /> Editar perfil
          </Link>
        )}

        {/* Availability badge — only shown when not the owner (owner has edit button there) */}
        {dev.available && !isOwner && (
          <div className="absolute top-4 right-4 sm:right-6">
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-400 text-white px-3 py-1 rounded-full shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> Disponible
            </span>
          </div>
        )}

        {/* Profile section */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 pb-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {dev.avatarUrl?.startsWith('gradient:') ? (
                (() => {
                  const [, from, to] = dev.avatarUrl.split(':');
                  return (
                    <div className={`w-24 h-24 rounded-2xl bg-linear-to-br ${from} ${to} flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg`}>
                      {initial}
                    </div>
                  );
                })()
              ) : (
                <img
                  src={dev.avatarUrl || defaultAvatar(dev.name)}
                  alt={dev.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-gray-100"
                />
              )}
              {dev.available && (
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{dev.name}</h1>
                {dev.available && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Disponible
                  </span>
                )}
                {dev.verified && (
                  <Tip text="Identidad verificada por la plataforma">
                    <CheckCircle size={18} className="text-blue-500" fill="currentColor" />
                  </Tip>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                {dev.university && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={13} />
                    {dev.university}{dev.cycle ? ` · ${dev.cycle}` : ''}
                  </span>
                )}
                {dev.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {dev.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-16 mt-2">

        {/* Stats bar */}
        <div className="flex gap-3 flex-wrap mb-6">
          <StatCard icon={Star} label="Calificación" value={dev.rating > 0 ? dev.rating.toFixed(1) : '—'} color="text-amber-500" />
          <StatCard icon={Shield} label="Trust Points" value={dev.trustPoints ?? 0} color="text-primary-600" />
          {dev.warrantyDays != null && (
            <StatCard icon={Shield} label="Garantía" value={`${dev.warrantyDays}d`} color="text-green-600" />
          )}
          {dev.hourlyRate != null && (
            <StatCard icon={DollarSign} label="Por hora" value={`$${Number(dev.hourlyRate)}`} color="text-gray-700" />
          )}
          <StatCard icon={Briefcase} label="Proyectos" value={completedWork.length} color="text-purple-600" />
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── LEFT column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Bio */}
            {dev.bio && (
              <Section title="Sobre mí" icon={Globe}>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{dev.bio}</p>
              </Section>
            )}

            {/* Skills */}
            {dev.skills.length > 0 && (
              <Section title="Stack tecnológico" icon={Tag}>
                <div className="flex flex-wrap gap-2">
                  {dev.skills.map((s) => <SkillPill key={s} label={s} />)}
                </div>
              </Section>
            )}

            {/* Specialty Badges */}
            {activeBadges.length > 0 && (
              <Section title="Medallas de especialidad" icon={Star}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeBadges.map((key) => {
                    const b = BADGES[key];
                    const Icon = b.icon;
                    return (
                      <div key={key} className={`flex items-start gap-3 rounded-xl border p-3 ${b.bg}`}>
                        <span className={`flex items-center justify-center w-9 h-9 rounded-full ${b.bg} ${b.color} shrink-0 border`}>
                          <Icon size={16} />
                        </span>
                        <div>
                          <p className={`text-xs font-semibold ${b.color}`}>{b.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Completed work */}
            <Section title="Proyectos realizados" icon={Briefcase}>
              {completedWork.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aún no hay proyectos completados registrados en la plataforma.
                </p>
              ) : (
                <div className="space-y-4">
                  {completedWork.map((w) => (
                    <Link
                      key={w.id}
                      href={`/projects/${w.project.id}`}
                      className="block rounded-xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {w.project.category && (
                              <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{w.project.category}</span>
                            )}
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Completado</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-700 transition-colors line-clamp-1">
                            {w.project.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                            <Building2 size={11} />
                            {w.project.company.name}
                            {w.project.company.verified && (
                              <CheckCircle size={10} className="text-blue-400" fill="currentColor" />
                            )}
                          </div>
                          {w.project.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {w.project.skills.slice(0, 4).map((s) => (
                                <span key={s} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><DollarSign size={10} />${Number(w.budget).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{w.timeline}d</span>
                          <ExternalLink size={12} className="mt-1 text-gray-300 group-hover:text-primary-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ── RIGHT sidebar ── */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">

            {/* Rating card */}
            {dev.rating > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                <Stars value={dev.rating} max={5} />
                <p className="text-3xl font-bold text-gray-900 mt-2">{dev.rating.toFixed(1)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {dev.reviewCount ?? 0} reseña{(dev.reviewCount ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Quick info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información</h3>
              {dev.hourlyRate != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><DollarSign size={13} /> Tarifa/hora</span>
                  <span className="font-semibold text-gray-900">${Number(dev.hourlyRate)}</span>
                </div>
              )}
              {dev.warrantyDays != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Shield size={13} /> Garantía</span>
                  <span className="font-semibold text-gray-900">{dev.warrantyDays} días</span>
                </div>
              )}
              {dev.university && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><GraduationCap size={13} /> Universidad</span>
                  <span className="font-semibold text-gray-900 text-right max-w-35 text-xs leading-snug">{dev.university}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Estado</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${dev.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {dev.available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>

            {/* Links */}
            {(dev.portfolioUrl || dev.githubUrl || dev.linkedinUrl) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Links</h3>
                {dev.portfolioUrl && (
                  <a
                    href={dev.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary-600 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <Globe size={14} className="text-primary-600" />
                    </span>
                    <span className="truncate">Portfolio</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-primary-400 shrink-0" />
                  </a>
                )}
                {dev.githubUrl && (
                  <a
                    href={dev.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-gray-900 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                      <Github size={14} className="text-gray-700" />
                    </span>
                    <span className="truncate">GitHub</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </a>
                )}
                {dev.linkedinUrl && (
                  <a
                    href={dev.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Linkedin size={14} className="text-blue-600" />
                    </span>
                    <span className="truncate">LinkedIn</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-blue-400 shrink-0" />
                  </a>
                )}
              </div>
            )}

            {/* Trust points */}
            <div className="bg-linear-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-primary-200 uppercase tracking-wider">Trust Points</h3>
                <Shield size={16} className="text-primary-300" />
              </div>
              <p className="text-3xl font-bold">{dev.trustPoints ?? 0}</p>
              <p className="text-xs text-primary-200 mt-1 leading-snug">
                Basado en puntualidad, comunicación y calidad de entrega.
              </p>
            </div>

            {/* Dispute warning */}
            {(dev.disputeLosses ?? 0) > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Disputas perdidas</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {dev.disputeLosses} disputa{dev.disputeLosses !== 1 ? 's' : ''} resuelta{dev.disputeLosses !== 1 ? 's' : ''} en contra por incumplimiento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
