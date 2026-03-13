'use client';

import Link from 'next/link';
import { Building2, User, Star } from 'lucide-react';

interface ProfileCardProps {
  name: string;
  role: 'company' | 'developer';
  logoUrl?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  extra?: string | null;
  skills?: string[];
  isCurrentUser?: boolean;
  profileHref?: string;
}

export function ProfileCard({
  name, role, logoUrl, avatarUrl, rating, extra, skills, isCurrentUser, profileHref,
}: ProfileCardProps) {
  const img = logoUrl ?? avatarUrl;

  const inner = (
    <>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
        role === 'company' ? 'bg-blue-100' : 'bg-violet-100'
      }`}>
        {img ? (
          <img src={img} alt={name} className="w-14 h-14 rounded-full object-cover" />
        ) : role === 'company' ? (
          <Building2 size={22} className="text-blue-600" />
        ) : (
          <User size={22} className="text-violet-600" />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
          role === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
        }`}>
          {role === 'company' ? 'Empresa' : 'Developer'}
        </span>
        {isCurrentUser && (
          <p className="text-[10px] text-primary-500 mt-0.5">Tú</p>
        )}
      </div>

      {rating !== undefined && rating > 0 && (
        <div className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{rating.toFixed(1)}</span>
        </div>
      )}

      {extra && <p className="text-[11px] text-gray-400 leading-tight">{extra}</p>}

      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1">
          {skills.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      )}
    </>
  );

  const baseClass = `bg-white rounded-2xl border p-4 flex flex-col items-center text-center gap-2 ${
    isCurrentUser ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-100'
  }`;

  if (profileHref && !isCurrentUser) {
    return (
      <Link href={profileHref} className={`${baseClass} block hover:ring-2 hover:ring-primary-200 transition-all cursor-pointer`}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

export function EmptyProfileCard({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 min-h-30">
      <User size={20} className="text-gray-300" />
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}
