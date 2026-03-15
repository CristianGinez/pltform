'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-profile';
import { defaultAvatar } from '@/lib/avatar';
import { getNavCards } from './constants';

export function AuthenticatedHome() {
  const { user, logout } = useAuthStore();
  const { data: me } = useMe();
  const router = useRouter();

  const isCompany = user?.role === 'COMPANY';
  const name = me?.developer?.name || me?.company?.name || user?.email?.split('@')[0] || '';
  const avatarUrl = me?.developer?.avatarUrl || me?.company?.logoUrl;
  const navCards = getNavCards(isCompany);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">

        {/* Welcome */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl && !avatarUrl.startsWith('gradient:') ? avatarUrl : defaultAvatar(name)}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
            <div>
              <p className="text-sm text-gray-500">Bienvenido de vuelta</p>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 mt-0.5 ${isCompany ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {isCompany ? 'Empresa' : 'Developer'}
              </span>
            </div>
          </div>

          {isCompany && (
            <Link
              href="/dashboard/projects/new"
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              + Nuevo proyecto
            </Link>
          )}
        </div>

        {/* Role-based primary CTA */}
        <div className={`rounded-2xl p-6 mb-8 ${isCompany ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-80 mb-1">
                {isCompany ? 'Siguiente paso' : 'Oportunidades disponibles'}
              </p>
              <h2 className="text-xl font-bold">
                {isCompany
                  ? '¿Tenés un nuevo proyecto en mente?'
                  : 'Hay proyectos esperando tu propuesta'}
              </h2>
              <p className="text-sm opacity-70 mt-1">
                {isCompany
                  ? 'Publicalo gratis y empezá a recibir propuestas hoy.'
                  : 'Explorá los proyectos abiertos y postulate a los que más te interesan.'}
              </p>
            </div>
            <Link
              href={isCompany ? '/dashboard/projects/new' : '/projects'}
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: isCompany ? '#2563eb' : '#7c3aed' }}
            >
              {isCompany ? 'Publicar proyecto' : 'Ver proyectos'}
            </Link>
          </div>
        </div>

        {/* Navigation grid */}
        <h2 className="text-base font-semibold text-gray-700 mb-4">Acceso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {navCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-2xl border p-5 transition-all hover:shadow-sm ${card.color}`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center text-xl mb-3`}>
                {card.icon}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{card.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm text-gray-400">
          <Link href="/projects" className="hover:text-gray-600 transition-colors">Todos los proyectos</Link>
          <Link href="/developers" className="hover:text-gray-600 transition-colors">Directorio de developers</Link>
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard completo</Link>
          <button onClick={handleLogout} className="hover:text-red-500 transition-colors ml-auto cursor-pointer">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
