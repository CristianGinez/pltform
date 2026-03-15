import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Developer, PaginatedResponse } from '@/types';

export function usePublicDevelopers(options?: { skill?: string; search?: string }) {
  return useInfiniteQuery<PaginatedResponse<Developer>>({
    queryKey: ['public-developers', options?.skill, options?.search],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' });
      if (pageParam) params.set('cursor', pageParam as string);
      if (options?.skill) params.set('skill', options.skill);
      if (options?.search?.trim()) params.set('search', options.search.trim());
      return api.get(`/developers?${params}`).then((r) => r.data);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
