'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-profile';
import { defaultAvatar } from '@/lib/avatar';

/* ─────────────────────── LANDING (no autenticado) ─────────────────────── */

const features = [
  { icon: '🎯', title: 'Proyectos con propósito', desc: 'Publicá tu necesidad digital con presupuesto y plazos claros. Sin intermediarios, sin comisiones ocultas.' },
  { icon: '✅', title: 'Developers verificados', desc: 'Cada developer tiene perfil completo, portfolio y historial de contratos.' },
  { icon: '🔒', title: 'Contratos seguros', desc: 'Milestones con pagos protegidos. El dinero solo se libera cuando aprobás el trabajo.' },
  { icon: '⚡', title: 'Rápido y simple', desc: 'De la publicación al contrato en días, no semanas. Todo desde el dashboard.' },
];

const steps = [
  { step: '01', title: 'Publicá tu proyecto', desc: 'Describí tu necesidad, presupuesto y plazos en minutos.' },
  { step: '02', title: 'Recibí propuestas', desc: 'Developers calificados postulan con propuesta y precio personalizado.' },
  { step: '03', title: 'Contratá con confianza', desc: 'Gestioná contratos, milestones y pagos de forma segura.' },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 text-center">
          <span className="inline-block rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold text-primary-700 uppercase tracking-wide mb-6">
            Marketplace B2B · Latinoamérica
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Conectá tu negocio con<br />
            <span className="text-primary-600">el mejor talento digital</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            La plataforma donde empresas publican proyectos y developers top compiten por resolverlos —
            con contratos, milestones y pagos seguros.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/register?role=COMPANY" className="w-full sm:w-auto rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-primary-700 transition-colors text-center shadow-sm">
              Publicar un proyecto →
            </Link>
            <Link href="/register?role=DEVELOPER" className="w-full sm:w-auto rounded-xl border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center">
              Soy desarrollador
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">Gratis para registrarse · Sin tarjeta de crédito</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '500+', label: 'Proyectos publicados' },
              { value: '1,200+', label: 'Desarrolladores activos' },
              { value: '320+', label: 'Contratos completados' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-bold text-primary-600">{s.value}</p>
                <p className="mt-2 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Todo en un solo lugar</h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">Desde la publicación hasta el pago final, Pltform cubre cada etapa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-7 hover:border-primary-200 hover:shadow-sm transition-all">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For companies / developers */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-5">Para Empresas</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Encontrá el developer ideal para tu proyecto</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {['Publicá gratis en minutos', 'Recibí propuestas con presupuesto real', 'Elegí al mejor candidato sin presión', 'Pagá solo por resultados aprobados'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> {item}</li>
                ))}
              </ul>
              <Link href="/register?role=COMPANY" className="mt-8 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
                Publicar proyecto gratis
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm">
              <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 mb-5">Para Developers</span>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trabajá en proyectos reales con clientes verificados</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {['Explorá proyectos que te interesan', 'Postulá con tu propuesta y precio', 'Contratos formales con milestones claros', 'Cobros seguros y a tiempo'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="text-primary-600 font-bold">✓</span> {item}</li>
                ))}
              </ul>
              <Link href="/register?role=DEVELOPER" className="mt-8 inline-block rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Crear perfil de developer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">¿Cómo funciona?</h2>
            <p className="mt-4 text-gray-500">Tres pasos para arrancar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <span className="text-5xl font-black text-primary-100">{s.step}</span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 text-2xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 sm:py-20 bg-primary-600">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Empezá hoy. Es gratis.</h2>
          <p className="mt-4 text-primary-100 text-lg">Registrate en minutos y conectá con el ecosistema digital de Latinoamérica.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register?role=COMPANY" className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 hover:bg-primary-50 transition-colors text-center">
              Soy empresa
            </Link>
            <Link href="/register?role=DEVELOPER" className="w-full sm:w-auto rounded-xl border border-primary-400 px-8 py-3.5 text-base font-semibold text-white hover:bg-primary-700 transition-colors text-center">
              Soy developer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-700">Pltform</span>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Pltform. Todos los derechos reservados.</p>
          <div className="flex gap-5 text-sm text-gray-400">
            <Link href="/projects" className="hover:text-gray-600 transition-colors">Proyectos</Link>
            <Link href="/developers" className="hover:text-gray-600 transition-colors">Developers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────── HOME AUTENTICADO ─────────────────────── */

function AuthenticatedHome() {
  const { user, logout } = useAuthStore();
  const { data: me } = useMe();
  const router = useRouter();

  const isCompany = user?.role === 'COMPANY';
  const name = me?.developer?.name || me?.company?.name || user?.email?.split('@')[0] || '';
  const avatarUrl = me?.developer?.avatarUrl || me?.company?.logoUrl;

  const navCards = [
    {
      href: '/projects',
      icon: '📋',
      label: 'Proyectos',
      desc: isCompany ? 'Tus proyectos publicados y borradores' : 'Explorá proyectos disponibles',
      color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100',
    },
    {
      href: '/developers',
      icon: '👨‍💻',
      label: 'Developers',
      desc: 'Explorá el directorio de desarrolladores',
      color: 'bg-purple-50 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100',
    },
    {
      href: '/dashboard/proposals',
      icon: '📨',
      label: 'Propuestas',
      desc: isCompany ? 'Propuestas recibidas en tus proyectos' : 'Tus postulaciones enviadas',
      color: 'bg-amber-50 border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-100',
    },
    {
      href: '/dashboard/contracts',
      icon: '📝',
      label: 'Contratos',
      desc: 'Contratos activos y su estado',
      color: 'bg-green-50 border-green-100 hover:border-green-300',
      iconBg: 'bg-green-100',
    },
    {
      href: '/dashboard/profile',
      icon: '👤',
      label: 'Mi perfil',
      desc: 'Editá tu información y configuración',
      color: 'bg-gray-50 border-gray-200 hover:border-gray-400',
      iconBg: 'bg-gray-200',
    },
    ...(isCompany
      ? [{
          href: '/dashboard/projects/new',
          icon: '➕',
          label: 'Nuevo proyecto',
          desc: 'Publicá un nuevo proyecto ahora',
          color: 'bg-primary-50 border-primary-100 hover:border-primary-400',
          iconBg: 'bg-primary-100',
        }]
      : [{
          href: '/projects',
          icon: '🔍',
          label: 'Buscar trabajo',
          desc: 'Encontrá el próximo proyecto para postular',
          color: 'bg-primary-50 border-primary-100 hover:border-primary-400',
          iconBg: 'bg-primary-100',
        }]
    ),
  ];

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
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
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
              className="flex-shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold transition-colors"
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

/* ─────────────────────── ENTRY POINT ─────────────────────── */

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();

  // Esperar hidratación para evitar flash
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return user ? <AuthenticatedHome /> : <LandingPage />;
}
