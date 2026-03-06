import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Proposal } from '@/types';
import type { ProposalFormData } from '@/schemas/proposal.schema';

export function useMyProposals() {
  return useQuery<Proposal[]>({
    queryKey: ['my-proposals'],
    queryFn: () => api.get('/proposals/my').then((r) => r.data),
  });
}

export function useSubmitProposal(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProposalFormData) =>
      api.post(`/proposals/project/${projectId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useWithdrawProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/proposals/${id}/withdraw`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-proposals'] }),
  });
}
