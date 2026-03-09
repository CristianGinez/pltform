'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Filter, Gavel, ThumbsUp, ThumbsDown, Handshake, BadgeCheck, BadgeX, ClipboardList, ExternalLink, Building2, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import { useAdminNotifications } from '@/hooks/use-notifications';
import { useDisputedContracts, useResolveDispute } from '@/hooks/use-contracts';
import { useAdminVerifications, useApproveVerification, useRejectVerification } from '@/hooks/use-verification';
import { defaultAvatar } from '@/lib/avatar';
import type { NotificationType } from '@/types';

const TYPE_LABELS: Record<NotificationType, string> = {
  PROPOSAL_RECEIVED: 'Propuesta recibida',
  PROPOSAL_ACCEPTED: 'Propuesta aceptada',
  PROPOSAL_REJECTED: 'Propuesta rechazada',
  PROPOSAL_WITHDRAWN: 'Propuesta retirada',
  CONTRACT_CREATED: 'Contrato creado',
  MILESTONE_SUBMITTED: 'Milestone entregado',
  MILESTONE_APPROVED: 'Milestone aprobado',
  MILESTONE_STARTED: 'Milestone iniciado',
  MILESTONE_REVISION_REQUESTED: 'Revisión solicitada',
  MILESTONE_PAID: 'Milestone pagado',
  CONTRACT_COMPLETED: 'Proyecto completado',
  MESSAGE_RECEIVED: 'Nuevo mensaje',
  DISPUTE_OPENED: 'Disputa abierta',
  DISPUTE_RESOLVED: 'Disputa resuelta',
  VERIFICATION_SUBMITTED: 'Verificación solicitada',
  VERIFICATION_APPROVED: 'Verificación aprobada',
  VERIFICATION_REJECTED: 'Verificación rechazada',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  PROPOSAL_RECEIVED: 'bg-blue-100 text-blue-700',
  PROPOSAL_ACCEPTED: 'bg-green-100 text-green-700',
  PROPOSAL_REJECTED: 'bg-red-100 text-red-700',
  PROPOSAL_WITHDRAWN: 'bg-gray-100 text-gray-600',
  CONTRACT_CREATED: 'bg-purple-100 text-purple-700',
  MILESTONE_SUBMITTED: 'bg-orange-100 text-orange-700',
  MILESTONE_APPROVED: 'bg-emerald-100 text-emerald-700',
  MILESTONE_STARTED: 'bg-blue-100 text-blue-700',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  MILESTONE_PAID: 'bg-emerald-100 text-emerald-700',
  CONTRACT_COMPLETED: 'bg-green-100 text-green-700',
  MESSAGE_RECEIVED: 'bg-blue-100 text-blue-700',
  DISPUTE_OPENED: 'bg-red-100 text-red-700',
  DISPUTE_RESOLVED: 'bg-green-100 text-green-700',
  VERIFICATION_SUBMITTED: 'bg-blue-100 text-blue-700',
  VERIFICATION_APPROVED: 'bg-green-100 text-green-700',
  VERIFICATION_REJECTED: 'bg-red-100 text-red-700',
};

function VerificationCard({ entry }: { entry: {
  id: string;
  name: string;
  avatarUrl?: string;
  logoUrl?: string;
  verificationDocUrl?: string;
  verificationDocType?: string;
  verificationNotes?: string;
  ruc?: string;
  type: 'developer' | 'company';
} }) {
  const approve = useApproveVerification();
  const reject = useRejectVerification();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const avatarSrc = entry.type === 'developer' ? (entry.avatarUrl || defaultAvatar(entry.name)) : (entry.logoUrl || defaultAvatar(entry.name));

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <img src={avatarSrc} alt={entry.name} className="w-10 h-10 rounded-full object-cover border border-blue-100 bg-gray-50" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{entry.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {entry.type === 'developer' ? <UserIcon size={11} /> : <Building2 size={11} />}
            <span>{entry.type === 'developer' ? 'Developer' : 'Empresa'}</span>
            {entry.ruc && <span className="ml-1">· RUC: {entry.ruc}</span>}
          </div>
        </div>
        {entry.verificationDocType && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium shrink-0">
            {entry.verificationDocType}
          </span>
        )}
      </div>

      {entry.verificationDocUrl && (
        <a href={entry.verificationDocUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mb-3 cursor-pointer">
          <ExternalLink size={11} />Ver documento adjunto
        </a>
      )}

      {rejecting ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo del rechazo (obligatorio)…"
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => setRejecting(false)}
              className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              Cancelar
            </button>
            <button
              onClick={() => reject.mutate({ type: entry.type, id: entry.id, reason })}
              disabled={!reason.trim() || reject.isPending}
              className="flex-1 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer">
              {reject.isPending ? 'Rechazando…' : 'Confirmar rechazo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => approve.mutate({ type: entry.type, id: entry.id })}
            disabled={approve.isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors cursor-pointer">
            <BadgeCheck size={13} />Aprobar
          </button>
          <button
            onClick={() => setRejecting(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
            <BadgeX size={13} />Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: {
  id: string;
  disputeReason?: string | null;
  disputeOpenedById?: string | null;
  project: { title: string; company: { name: string } };
  milestones: { status: string; amount: number }[];
} }) {
  const resolve = useResolveDispute(dispute.id);
  const submittedCount = dispute.milestones.filter((m) => m.status === 'SUBMITTED').length;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold text-sm text-gray-900">{dispute.project.title}</p>
          <p className="text-xs text-gray-500">{dispute.project.company.name}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium whitespace-nowrap">
          En disputa
        </span>
      </div>
      {dispute.disputeReason && (
        <p className="text-xs text-gray-700 mb-3 bg-white rounded-lg p-2 border border-red-100">
          <span className="font-medium">Motivo:</span> {dispute.disputeReason}
        </p>
      )}
      <p className="text-xs text-gray-500 mb-3">
        {submittedCount} milestone{submittedCount !== 1 ? 's' : ''} en estado SUBMITTED
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => resolve.mutate('dev_wins')}
          disabled={resolve.isPending}
          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors cursor-pointer">
          <ThumbsUp size={12} />A favor del developer
        </button>
        <button
          onClick={() => resolve.mutate('company_wins')}
          disabled={resolve.isPending}
          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer">
          <ThumbsDown size={12} />A favor de la empresa
        </button>
        <button
          onClick={() => resolve.mutate('mutual')}
          disabled={resolve.isPending}
          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60 transition-colors cursor-pointer">
          <Handshake size={12} />Cancelación mutua
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<NotificationType | ''>('');
  const { data: notifications = [], isLoading } = useAdminNotifications();
  const { data: disputes = [], isLoading: isLoadingDisputes } = useDisputedContracts();
  const { data: verificationsData, isLoading: isLoadingVerifications } = useAdminVerifications();

  if (!user) return null;
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <ShieldAlert size={40} className="text-red-400" />
        <p className="text-lg font-semibold text-gray-700">Acceso denegado</p>
        <p className="text-sm text-gray-400">Esta sección es solo para administradores.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-primary-600 hover:underline cursor-pointer"
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

      {/* Verificaciones pendientes */}
      {(() => {
        const all = [...(verificationsData?.developers ?? []), ...(verificationsData?.companies ?? [])];
        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={16} className="text-blue-500" />
              <h2 className="text-base font-semibold text-gray-800">Verificaciones pendientes</h2>
              {all.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {all.length}
                </span>
              )}
            </div>
            {isLoadingVerifications ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : all.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
                No hay verificaciones pendientes.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {all.map((entry) => <VerificationCard key={`${entry.type}-${entry.id}`} entry={entry} />)}
              </div>
            )}
          </div>
        );
      })()}

      {/* Disputas activas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gavel size={16} className="text-red-500" />
          <h2 className="text-base font-semibold text-gray-800">Disputas activas</h2>
          {disputes.length > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {disputes.length}
            </span>
          )}
        </div>
        {isLoadingDisputes ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
            No hay disputas activas.
          </p>
        ) : (
          <div className="space-y-3">
            {(disputes as Parameters<typeof DisputeCard>[0]['dispute'][]).map((d) => (
              <DisputeCard key={d.id} dispute={d} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 mb-4">
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
    </div>
  );
}
