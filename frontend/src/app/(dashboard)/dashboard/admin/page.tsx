'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import { useAdminNotifications } from '@/hooks/use-notifications';
import type { NotificationType } from '@/types';

const TYPE_LABELS: Record<NotificationType, string> = {
  PROPOSAL_RECEIVED: 'Propuesta recibida',
  PROPOSAL_ACCEPTED: 'Propuesta aceptada',
  PROPOSAL_REJECTED: 'Propuesta rechazada',
  PROPOSAL_WITHDRAWN: 'Propuesta retirada',
  CONTRACT_CREATED: 'Contrato creado',
  MILESTONE_SUBMITTED: 'Milestone entregado',
  MILESTONE_APPROVED: 'Milestone aprobado',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  PROPOSAL_RECEIVED: 'bg-blue-100 text-blue-700',
  PROPOSAL_ACCEPTED: 'bg-green-100 text-green-700',
  PROPOSAL_REJECTED: 'bg-red-100 text-red-700',
  PROPOSAL_WITHDRAWN: 'bg-gray-100 text-gray-600',
  CONTRACT_CREATED: 'bg-purple-100 text-purple-700',
  MILESTONE_SUBMITTED: 'bg-orange-100 text-orange-700',
  MILESTONE_APPROVED: 'bg-emerald-100 text-emerald-700',
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<NotificationType | ''>('');
  const { data: notifications = [], isLoading } = useAdminNotifications();

  if (!user) return null;
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <ShieldAlert size={40} className="text-red-400" />
        <p className="text-lg font-semibold text-gray-700">Acceso denegado</p>
        <p className="text-sm text-gray-400">Esta sección es solo para administradores.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-primary-600 hover:underline"
        >
          Volver al dashboard
        </button>
      </div>
    );
  }

  const filtered = filter ? notifications.filter((n) => n.type === filter) : notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert size={20} className="text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={15} className="text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as NotificationType | '')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos los eventos</option>
          {(Object.keys(TYPE_LABELS) as NotificationType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{filtered.length} eventos</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Sin eventos registrados</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 font-medium">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs">{n.user?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}
                    >
                      {TYPE_LABELS[n.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{n.body}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
