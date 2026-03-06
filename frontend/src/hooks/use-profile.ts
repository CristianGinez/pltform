import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import type { User } from '@/types';

export function useMe() {
  const { user } = useAuthStore();
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
    enabled: !!user,
  });
}

export function useUpdateProfile(isCompany: boolean) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(isCompany ? '/companies/me' : '/developers/me', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
