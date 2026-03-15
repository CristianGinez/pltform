import Link from 'next/link';

export function Hero() {
  return (
    <section className="bg-linear-to-b from-primary-50 to-white">
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
  );
}
