import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { Contract, ContractMessage } from '@/types';

export function useContract(id: string) {
  return useQuery<Contract>({
    queryKey: ['contract', id],
    queryFn: () => api.get(`/contracts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useStartMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: string; milestoneId: string }) =>
      api.patch(`/contracts/${contractId}/milestones/${milestoneId}/start`).then((r) => r.data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('Milestone iniciado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al iniciar el milestone');
    },
  });
}

export function useSubmitMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      deliveryNote,
      deliveryLink,
    }: {
      contractId: string;
      milestoneId: string;
      deliveryNote?: string;
      deliveryLink?: string;
    }) =>
      api
        .patch(`/contracts/${contractId}/milestones/${milestoneId}/submit`, { deliveryNote, deliveryLink })
        .then((r) => r.data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('Milestone entregado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al entregar el milestone');
    },
  });
}

export function useApproveMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: string; milestoneId: string }) =>
      api.patch(`/contracts/${contractId}/milestones/${milestoneId}/approve`).then((r) => r.data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('Milestone aprobado y pagado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al aprobar el milestone');
    },
  });
}

export function useRequestRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      milestoneId,
      reason,
    }: {
      contractId: string;
      milestoneId: string;
      reason?: string;
    }) =>
      api
        .patch(`/contracts/${contractId}/milestones/${milestoneId}/request-revision`, { reason })
        .then((r) => r.data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('Revisión solicitada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al solicitar revisión');
    },
  });
}

export function useContractMessages(contractId: string) {
  return useQuery<ContractMessage[]>({
    queryKey: ['contract-messages', contractId],
    queryFn: () => api.get(`/contracts/${contractId}/messages`).then((r) => r.data),
    enabled: !!contractId,
    refetchInterval: 10_000,
  });
}

export function useSendMessage(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/contracts/${contractId}/messages`, { content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
    },
    onError: () => toast.error('Error al enviar el mensaje'),
  });
}
