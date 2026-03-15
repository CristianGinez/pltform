import { STEPS } from './constants';

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">¿Cómo funciona?</h2>
          <p className="mt-4 text-gray-500">Tres pasos para arrancar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              <div className="bg-gray-50 rounded-2xl p-8">
                <span className="text-5xl font-black text-primary-100">{s.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 text-2xl z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
