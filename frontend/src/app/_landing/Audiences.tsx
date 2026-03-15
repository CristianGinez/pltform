import Link from 'next/link';

export function Audiences() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Companies */}
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

          {/* For Developers */}
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
  );
}
