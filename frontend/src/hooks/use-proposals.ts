import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { Proposal } from '@/types';
import type { ProposalFormData } from '@/schemas/proposal.schema';
import { useAuthStore } from '@/store/auth.store';

export function useMyProposals() {
  const { user } = useAuthStore();
  return useQuery<Proposal[]>({
    queryKey: ['my-proposals'],
    queryFn: () => api.get('/proposals/my').then((r) => r.data),
    enabled: user?.role === 'DEVELOPER',
  });
}

export function useSubmitProposal(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProposalFormData & { milestonePlan?: Array<{ title: string; description?: string; amount: number; order: number }> }) =>
      api.post(`/proposals/project/${projectId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Propuesta enviada exitosamente');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Error al enviar la propuesta');
    },
  });
}

export function useWithdrawProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/proposals/${id}/withdraw`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-proposals'] });
      toast.success('Propuesta retirada');
    },
    onError: () => toast.error('Error al retirar la propuesta'),
  });
}
