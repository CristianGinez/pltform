'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  FileText,
  CheckCircle,
  XCircle,
  Minus,
  ScrollText,
  CheckSquare,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import type { Notification, NotificationType } from '@/types';

const typeIcon: Record<NotificationType, React.ReactNode> = {
  PROPOSAL_RECEIVED: <FileText size={15} className="text-blue-500" />,
  PROPOSAL_ACCEPTED: <CheckCircle size={15} className="text-green-500" />,
  PROPOSAL_REJECTED: <XCircle size={15} className="text-red-500" />,
  PROPOSAL_WITHDRAWN: <Minus size={15} className="text-gray-400" />,
  CONTRACT_CREATED: <ScrollText size={15} className="text-purple-500" />,
  MILESTONE_SUBMITTED: <ScrollText size={15} className="text-orange-500" />,
  MILESTONE_APPROVED: <CheckSquare size={15} className="text-green-600" />,
  MILESTONE_STARTED: <ScrollText size={15} className="text-blue-500" />,
  MILESTONE_REVISION_REQUESTED: <ScrollText size={15} className="text-orange-600" />,
  MILESTONE_PAID: <CheckSquare size={15} className="text-emerald-600" />,
  CONTRACT_COMPLETED: <CheckCircle size={15} className="text-green-700" />,
  MESSAGE_RECEIVED: <MessageSquare size={15} className="text-blue-500" />,
  DISPUTE_OPENED: <ShieldAlert size={15} className="text-red-500" />,
  DISPUTE_RESOLVED: <CheckCircle size={15} className="text-green-600" />,
};

function getNotificationUrl(n: Notification): string | null {
  if (!n.entityId) return null;
  if (n.entityType === 'contract') return `/dashboard/contracts/${n.entityId}`;
  if (n.entityType === 'project') return `/dashboard/projects/${n.entityId}`;
  return null;
}

function NotificationItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const router = useRouter();

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    const url = getNotificationUrl(n);
    if (url) router.push(url);
  };

  const url = getNotificationUrl(n);

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        !n.read ? 'bg-blue-50/60' : ''
      } ${url ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="mt-0.5 shrink-0">{typeIcon[n.type]}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{n.body}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, 10);

  const DROPDOWN_W = 320;
  const MARGIN = 8;

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Align right edge of dropdown to right edge of button, then clamp to viewport
    let left = rect.right - DROPDOWN_W;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - DROPDOWN_W - MARGIN));
    setDropdownStyle({ top: rect.bottom + MARGIN, left });
  }, []);

  const handleToggle = () => {
    calcPosition();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcPosition]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ top: dropdownStyle.top, left: dropdownStyle.left }}
            className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {preview.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
              ) : (
                preview.map((n) => (
                  <NotificationItem key={n.id} n={n} onRead={(id) => { markRead(id); setOpen(false); }} />
                ))
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
