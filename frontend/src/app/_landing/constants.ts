// ─── Landing page data ────────────────────────────────────────────────

export const FEATURES = [
  { icon: '🎯', title: 'Proyectos con propósito', desc: 'Publicá tu necesidad digital con presupuesto y plazos claros. Sin intermediarios, sin comisiones ocultas.' },
  { icon: '✅', title: 'Developers verificados', desc: 'Cada developer tiene perfil completo, portfolio y historial de contratos.' },
  { icon: '🔒', title: 'Contratos seguros', desc: 'Milestones con pagos protegidos. El dinero solo se libera cuando aprobás el trabajo.' },
  { icon: '⚡', title: 'Rápido y simple', desc: 'De la publicación al contrato en días, no semanas. Todo desde el dashboard.' },
];

export const STEPS = [
  { step: '01', title: 'Publicá tu proyecto', desc: 'Describí tu necesidad, presupuesto y plazos en minutos.' },
  { step: '02', title: 'Recibí propuestas', desc: 'Developers calificados postulan con propuesta y precio personalizado.' },
  { step: '03', title: 'Contratá con confianza', desc: 'Gestioná contratos, milestones y pagos de forma segura.' },
];

export const STATS = [
  { value: '500+', label: 'Proyectos publicados' },
  { value: '1,200+', label: 'Desarrolladores activos' },
  { value: '320+', label: 'Contratos completados' },
];

// ─── Authenticated home data ──────────────────────────────────────────

export function getNavCards(isCompany: boolean) {
  return [
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
}
