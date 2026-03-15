import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/api-error';

// ─── Developer submit ─────────────────────────────────────────────────────────

export function useSubmitDeveloperVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { docUrl: string; docType: string }) =>
      api.post('/developers/me/verify', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Solicitud enviada. El equipo revisará tu documentación en breve.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Error al enviar la solicitud'));
    },
  });
}

// ─── Company submit ───────────────────────────────────────────────────────────

export function useSubmitCompanyVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { docUrl?: string; ruc?: string }) =>
      api.post('/companies/me/verify', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Solicitud enviada. El equipo revisará tu documentación en breve.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Error al enviar la solicitud'));
    },
  });
}

// ─── RUC validation ───────────────────────────────────────────────────────────

export function useValidateRuc() {
  return useMutation({
    mutationFn: (ruc: string) =>
      api.get(`/companies/validate-ruc?ruc=${ruc}`).then((r) => r.data as {
        valid: boolean;
        razonSocial?: string;
        estado?: string;
        condicion?: string;
      }),
    onError: () => toast.error('Error al validar el RUC'),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

interface VerificationEntry {
  id: string;
  name: string;
  avatarUrl?: string;
  logoUrl?: string;
  verificationDocUrl?: string;
  verificationDocType?: string;
  verificationNotes?: string;
  ruc?: string;
  userId: string;
  createdAt: string;
  type: 'developer' | 'company';
}

export function useAdminStats() {
  return useQuery<{
    developers: number;
    companies: number;
    activeContracts: number;
    openProjects: number;
    pendingVerifications: number;
    disputes: number;
  }>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useAdminVerifications() {
  return useQuery<{ developers: VerificationEntry[]; companies: VerificationEntry[] }>({
    queryKey: ['admin-verifications'],
    queryFn: () => api.get('/admin/verifications').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useApproveVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: 'developer' | 'company'; id: string }) =>
      api.patch(`/admin/verifications/${type}/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verifications'] });
      toast.success('Verificación aprobada');
    },
    onError: () => toast.error('Error al aprobar'),
  });
}

export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, reason }: { type: 'developer' | 'company'; id: string; reason: string }) =>
      api.patch(`/admin/verifications/${type}/${id}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verifications'] });
      toast.success('Verificación rechazada');
    },
    onError: () => toast.error('Error al rechazar'),
  });
}
