import Link from 'next/link';

export function Footer() {
  return (
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
  );
}
