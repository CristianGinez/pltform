import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Developer } from '@/types';

export function usePublicDevelopers(skill?: string) {
  return useQuery<Developer[]>({
    queryKey: ['public-developers', skill],
    queryFn: () =>
      api.get(`/developers${skill ? `?skill=${encodeURIComponent(skill)}` : ''}`).then((r) => r.data),
  });
}

export interface DeveloperProfile extends Developer {
  user?: { email: string };
  proposals?: Array<{
    id: string;
    budget: number;
    timeline: number;
    createdAt: string;
    project: {
      id: string;
      title: string;
      description: string;
      budget: number;
      skills: string[];
      category?: string;
      company: { name: string; verified: boolean };
      createdAt: string;
    };
  }>;
}

export function useDeveloper(id: string) {
  return useQuery<DeveloperProfile>({
    queryKey: ['developer', id],
    queryFn: () => api.get(`/developers/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
