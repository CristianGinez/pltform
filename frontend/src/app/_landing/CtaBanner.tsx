import Link from 'next/link';

export function CtaBanner() {
  return (
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
  );
}
