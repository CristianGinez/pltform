import Link from 'next/link';
import { Navbar } from '@/components/ui/navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:py-28 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          Conecta tu negocio con
          <br />
          <span className="text-primary-600">el mejor talento digital</span>
        </h1>
        <p className="mt-5 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
          Publica tu proyecto, recibe propuestas de desarrolladores verificados y
          contrata la solución digital que tu empresa necesita.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          <Link
            href="/register?role=COMPANY"
            className="w-full sm:w-auto rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-700 transition-colors text-center"
          >
            Publicar un proyecto
          </Link>
          <Link
            href="/register?role=DEVELOPER"
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Soy desarrollador
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            {[
              { label: 'Proyectos publicados', value: '500+' },
              { label: 'Desarrolladores activos', value: '1,200+' },
              { label: 'Contratos completados', value: '320+' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-primary-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900">¿Cómo funciona?</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Publica tu proyecto',
                desc: 'Describe tu necesidad digital, presupuesto y plazos en minutos.',
              },
              {
                step: '02',
                title: 'Recibe propuestas',
                desc: 'Developers calificados postulan con su propuesta y presupuesto personalizado.',
              },
              {
                step: '03',
                title: 'Contrata con confianza',
                desc: 'Gestiona contratos, milestones y pagos de forma segura en la plataforma.',
              },
            ].map((f) => (
              <div key={f.step} className="bg-white rounded-2xl p-8 shadow-sm">
                <span className="text-4xl font-bold text-primary-100">{f.step}</span>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Pltform. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
