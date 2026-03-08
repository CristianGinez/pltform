'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-profile';
import { defaultAvatar } from '@/lib/avatar';
import NotificationBell from '@/components/notification-bell';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const profileHref =
    user?.role === 'DEVELOPER' && me?.developer?.id
      ? `/developers/${me.developer.id}`
      : '/dashboard/profile';

  const avatarUrl = me?.developer?.avatarUrl || me?.company?.logoUrl;
  const profileName = me?.developer?.name || me?.company?.name || user?.email || '';

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/projects',   label: 'Proyectos' },
    { href: '/developers', label: 'Desarrolladores' },
  ];

  return (
    <>
      <nav className="border-b border-gray-100 bg-white px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold text-primary-700">pltform</Link>
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${
                    pathname === href ? 'text-primary-700 font-medium' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NotificationBell />

                <Link
                  href="/dashboard"
                  className="hidden sm:block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>

                {/* Profile dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <img
                      src={avatarUrl && !avatarUrl.startsWith('gradient:') ? avatarUrl : defaultAvatar(profileName)}
                      alt="perfil"
                      className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                    />
                    <span className="hidden sm:block max-w-[120px] truncate font-medium">{profileName}</span>
                    <ChevronDown size={13} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 truncate">{profileName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="sm:hidden flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={profileHref}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={14} className="text-gray-400" /> Mi perfil
                      </Link>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 mt-3 pt-3 pb-2 space-y-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === href ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
