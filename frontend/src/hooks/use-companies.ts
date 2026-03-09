import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface CompanyReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    developer?: { name: string; avatarUrl?: string | null } | null;
  };
}

export interface CompanyProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  logoUrl?: string | null;
  location?: string;
  verified: boolean;
  clientRating: number;
  clientReviewCount: number;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    category?: string;
    skills: string[];
    createdAt: string;
    _count: { proposals: number };
  }>;
  user: {
    reviewsReceived: CompanyReview[];
  };
}

export function useCompany(id: string) {
  return useQuery<CompanyProfile>({
    queryKey: ['company', id],
    queryFn: () => api.get(`/companies/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
