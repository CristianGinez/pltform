import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { Contract, ContractMessage } from '@/types';

export function useContract(id: string) {
  return useQuery<Contract>({
    queryKey: ['contract', id],
    queryFn: () => api.get(`/contracts/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 5_000,
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
    queryFn: () => api.get(`/contracts/${contractId}/messages?limit=200`).then((r) => r.data.data),
    enabled: !!contractId,
    refetchInterval: 3_000,
    staleTime: 0,
  });
}

export function useSendMessage(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/contracts/${contractId}/messages`, { content }).then((r) => r.data),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ['contract-messages', contractId] });
      const prev = qc.getQueryData<ContractMessage[]>(['contract-messages', contractId]) ?? [];
      const optimistic: ContractMessage = {
        id: `optimistic-${Date.now()}`,
        contractId,
        content,
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        sender: { id: '__me__', role: 'COMPANY', company: null, developer: null },
      };
      qc.setQueryData(['contract-messages', contractId], [...prev, optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['contract-messages', contractId], ctx.prev);
      toast.error('Error al enviar el mensaje');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
    },
  });
}

export function useProposeAction(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      milestoneId: string;
      action: string;
      deliveryNote?: string;
      deliveryLink?: string;
      reason?: string;
    }) =>
      api
        .post(`/contracts/${contractId}/milestones/${dto.milestoneId}/propose`, dto)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la propuesta');
    },
  });
}

export function useRespondToProposal(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      messageId: string;
      response: 'accept' | 'reject' | 'counter';
      counter?: string;
    }) =>
      api
        .post(`/contracts/${contractId}/proposals/${dto.messageId}/respond`, {
          response: dto.response,
          counter: dto.counter,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al responder la propuesta');
    },
  });
}

export function useSendProgressUpdate(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, note }: { milestoneId: string; note: string }) =>
      api.post(`/contracts/${contractId}/milestones/${milestoneId}/progress`, { note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      toast.success('Actualización enviada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la actualización');
    },
  });
}

export function useMarkReadyForTesting(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      api.post(`/contracts/${contractId}/milestones/${milestoneId}/testing`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      toast.success('¡Listo para testing! La empresa fue notificada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error');
    },
  });
}

export function useOpenDispute(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      api.post(`/contracts/${contractId}/dispute`, { reason }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      toast.success('Disputa abierta. El equipo revisará tu caso.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al abrir la disputa');
    },
  });
}

export function useResolveDispute(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ outcome, adminComment }: { outcome: 'dev_wins' | 'company_wins' | 'mutual'; adminComment?: string }) =>
      api.patch(`/contracts/${contractId}/resolve`, { outcome, adminComment }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['disputed-contracts'] });
      toast.success('Disputa resuelta');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al resolver la disputa');
    },
  });
}

export function useForceApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contractId, milestoneId }: { contractId: string; milestoneId: string }) =>
      api.post(`/contracts/${contractId}/milestones/${milestoneId}/force-approve`).then((r) => r.data),
    onSuccess: (_, { contractId }) => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      toast.success('Milestone aprobado automáticamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al forzar la aprobación');
    },
  });
}

export function useProposeCancel(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/contracts/${contractId}/propose-cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      toast.success('Propuesta de cancelación enviada');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al proponer cancelación');
    },
  });
}

export function useProposeMilestonePlan(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestones: Array<{ title: string; description?: string; amount: number; order: number }>) =>
      api.post(`/contracts/${contractId}/milestone-plan`, { milestones }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-messages', contractId] });
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('Plan de milestones enviado. Esperando aprobación de la empresa.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar el plan');
    },
  });
}

export function useDisputedContracts() {
  return useQuery({
    queryKey: ['disputed-contracts'],
    queryFn: () => api.get('/contracts/disputed').then((r) => r.data),
    staleTime: 10_000,
  });
}

export function useCreateReview(contractId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      api.post(`/contracts/${contractId}/review`, { rating, comment }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', contractId] });
      toast.success('¡Calificación enviada!');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la calificación');
    },
  });
}
