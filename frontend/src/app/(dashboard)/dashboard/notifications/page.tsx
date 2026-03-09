'use client';

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
  PROPOSAL_RECEIVED: <FileText size={16} className="text-blue-500" />,
  PROPOSAL_ACCEPTED: <CheckCircle size={16} className="text-green-500" />,
  PROPOSAL_REJECTED: <XCircle size={16} className="text-red-500" />,
  PROPOSAL_WITHDRAWN: <Minus size={16} className="text-gray-400" />,
  CONTRACT_CREATED: <ScrollText size={16} className="text-purple-500" />,
  MILESTONE_SUBMITTED: <ScrollText size={16} className="text-orange-500" />,
  MILESTONE_APPROVED: <CheckSquare size={16} className="text-green-600" />,
  MILESTONE_STARTED: <ScrollText size={16} className="text-blue-500" />,
  MILESTONE_REVISION_REQUESTED: <ScrollText size={16} className="text-orange-600" />,
  MILESTONE_PAID: <CheckSquare size={16} className="text-emerald-600" />,
  CONTRACT_COMPLETED: <CheckCircle size={16} className="text-green-700" />,
  MESSAGE_RECEIVED: <MessageSquare size={16} className="text-blue-500" />,
  DISPUTE_OPENED: <ShieldAlert size={16} className="text-red-500" />,
  DISPUTE_RESOLVED: <CheckCircle size={16} className="text-green-600" />,
};

function getNotificationUrl(n: Notification): string | null {
  if (!n.entityId) return null;
  if (n.entityType === 'contract') return `/dashboard/contracts/${n.entityId}`;
  if (n.entityType === 'project') return `/dashboard/projects/${n.entityId}`;
  return null;
}

function NotificationRow({ n }: { n: Notification }) {
  const router = useRouter();
  const { mutate: markRead } = useMarkRead();

  const handleClick = () => {
    if (!n.read) markRead(n.id);
    const url = getNotificationUrl(n);
    if (url) router.push(url);
  };

  const url = getNotificationUrl(n);

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-4 px-5 py-4 rounded-xl border transition-colors hover:bg-gray-50 ${
        !n.read ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'
      } ${url ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className="mt-0.5 shrink-0">{typeIcon[n.type]}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {n.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
    </button>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAllRead, isPending } = useMarkAllRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
              {unreadCount} no leídas
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isPending}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 cursor-pointer"
          >
            Marcar todo como leído
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}
