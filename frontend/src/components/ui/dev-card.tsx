'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle, MapPin, Package, CreditCard, Zap, Code, ShoppingBag, Smartphone, DollarSign, Shield } from 'lucide-react';
import { defaultAvatar } from '@/lib/avatar';

// ─── Badge catalog ────────────────────────────────────────────────────────────

export const BADGES: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  inventarios:  { label: 'Experto en Inventarios',       icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    desc: 'Implementó sistemas de gestión de stock para negocios locales' },
  pagos:        { label: 'Mago de Pasarelas de Pago',    icon: CreditCard,   color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', desc: 'Integró Culqi, Yape o PagoEfectivo exitosamente' },
  emergencias:  { label: 'Salvador de Emergencias',      icon: Zap,          color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   desc: 'Resolvió problemas críticos en menos de 24 horas' },
  web:          { label: 'Web Master',                   icon: Code,         color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   desc: 'Experto en desarrollo web full-stack' },
  ecommerce:    { label: 'E-commerce Pro',               icon: ShoppingBag,  color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200',     desc: 'Especialista en tiendas online y ventas digitales' },
  mobile:       { label: 'App Móvil',                    icon: Smartphone,   color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-200',     desc: 'Desarrollador de aplicaciones Android e iOS' },
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] w-52 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white text-center shadow-xl">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

export function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={13} className={i < Math.round(value) ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
      ))}
    </div>
  );
}

// ─── Dev card props ───────────────────────────────────────────────────────────

export interface DevCardData {
  id?: string;
  name: string;
  avatarUrl?: string;
  available: boolean;
  verified: boolean;
  university?: string;
  cycle?: string;
  rating: number;
  reviewCount?: number;
  trustPoints: number;
  skills: string[];
  specialtyBadges: string[];
  location?: string;
  hourlyRate?: string | number | null;
  warrantyDays?: string | number | null;
  bio?: string;
}

// ─── Developer card ───────────────────────────────────────────────────────────

export function DevCard({ d }: { d: DevCardData }) {
  const initial = d.name?.charAt(0)?.toUpperCase() ?? '?';
  const activeBadges = (d.specialtyBadges ?? []).filter((b) => BADGES[b]);
  const cardClass = `relative rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md select-none${d.id ? ' hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer' : ''}`;

  const inner = (
    <>
      {/* top */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {d.avatarUrl?.startsWith('gradient:') ? (
            (() => {
              const [, from, to] = d.avatarUrl.split(':');
              return (
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-100`}>
                  {initial}
                </div>
              );
            })()
          ) : (
            <img
              src={d.avatarUrl || defaultAvatar(d.name)}
              alt={d.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 bg-gray-50"
            />
          )}
          {d.available && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-base leading-tight truncate">{d.name || '—'}</span>
            {d.verified && (
              <Tip text="Identidad verificada por la plataforma">
                <CheckCircle size={15} className="text-blue-500 flex-shrink-0" fill="currentColor" />
              </Tip>
            )}
          </div>
          {d.university && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{d.university}{d.cycle ? ` · ${d.cycle}` : ''}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <Stars value={d.rating ?? 0} />
            <Tip text="Puntos de Confianza: basados en puntualidad y comunicación">
              <span className="text-xs font-bold text-gray-700 border border-gray-300 rounded px-2 py-0.5 bg-gray-50 cursor-default">
                {d.trustPoints ?? 0} pts
              </span>
            </Tip>
          </div>
        </div>
      </div>

      <div className="my-3 border-t border-gray-100" />

      {/* skills */}
      {(d.skills ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(d.skills ?? []).slice(0, 5).map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {(d.skills ?? []).length > 5 && (
            <span className="text-xs text-gray-400">+{(d.skills ?? []).length - 5}</span>
          )}
        </div>
      )}

      {/* badges */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activeBadges.map((key) => {
            const b = BADGES[key];
            const Icon = b.icon;
            return (
              <Tip key={key} text={`${b.label}: ${b.desc}`}>
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${b.bg} ${b.color} cursor-default`}>
                  <Icon size={15} />
                </span>
              </Tip>
            );
          })}
        </div>
      )}

      {/* bottom meta */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
        {d.location && <span className="flex items-center gap-1"><MapPin size={11} />{d.location}</span>}
        {d.hourlyRate != null && d.hourlyRate !== '' && (
          <span className="flex items-center gap-1"><DollarSign size={11} />${Number(d.hourlyRate)}/hr</span>
        )}
        {d.warrantyDays != null && d.warrantyDays !== '' && (
          <span className="flex items-center gap-1"><Shield size={11} />{d.warrantyDays}d garantía</span>
        )}
      </div>
    </>
  );

  if (d.id) {
    return <Link href={`/developers/${d.id}`} className={cardClass}>{inner}</Link>;
  }
  return <div className={cardClass}>{inner}</div>;
}
