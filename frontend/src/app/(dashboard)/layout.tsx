'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ScrollText,
  User,
  LogOut,
  Home,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import NotificationBell from '@/components/notification-bell';
import { useNotifications } from '@/hooks/use-notifications';

const navItems = {
  COMPANY: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/projects', label: 'Proyectos', icon: FolderKanban },
    { href: '/dashboard/contracts', label: 'Contratos', icon: ScrollText },
    { href: '/dashboard/profile', label: 'Perfil', icon: User },
  ],
  DEVELOPER: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/proposals', label: 'Propuestas', icon: FileText },
    { href: '/dashboard/contracts', label: 'Contratos', icon: ScrollText },
    { href: '/dashboard/profile', label: 'Perfil', icon: User },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin', label: 'Admin', icon: Bell },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, _hasHydrated } = useAuthStore();
  // Must be called before any early return to follow Rules of Hooks
  const { data: notifications = [] } = useNotifications();

  useEffect(() => {
    if (_hasHydrated && !user) router.push('/login');
  }, [_hasHydrated, user, router]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const items = navItems[user.role] ?? navItems.ADMIN;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-gray-100 flex-col flex-shrink-0 h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href="/" className="text-lg font-bold text-primary-700">
              pltform
            </Link>
            <p className="mt-1 text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <NotificationBell />
        </div>

        <div className="px-3 pt-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <Home size={16} />
            Ir a la plataforma
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 lg:overflow-y-auto pb-20 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-1 py-1 safe-area-pb">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                active ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-tight truncate">{label}</span>
            </Link>
          );
        })}

        <Link
          href="/dashboard/notifications"
          className={`relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors flex-1 ${
            pathname === '/dashboard/notifications' ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="relative">
            <Bell size={20} strokeWidth={pathname === '/dashboard/notifications' ? 2.5 : 1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium leading-tight">Avisos</span>
        </Link>

        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex-1"
        >
          <Home size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium leading-tight">Salir</span>
        </Link>
      </nav>
    </div>
  );
}
