export type Role = 'COMPANY' | 'DEVELOPER' | 'ADMIN';
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'PAID';

export interface User {
  id: string;
  email: string;
  role: Role;
  company?: Company;
  developer?: Developer;
  createdAt: string;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  logoUrl?: string;
  location?: string;
  verified: boolean;
  ruc?: string;
  contactPerson?: string;
  painDescription?: string;
  paymentMethods: string[];
  clientRating: number;
  clientReviewCount: number;
}

export interface Developer {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  skills: string[];
  hourlyRate?: number;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  location?: string;
  available: boolean;
  rating: number;
  reviewCount: number;
  university?: string;
  cycle?: string;
  specialtyBadges: string[];
  trustPoints: number;
  verified: boolean;
  ruc?: string;
  warrantyDays?: number;
}

export interface Project {
  id: string;
  companyId: string;
  company: Pick<Company, 'name' | 'logoUrl' | 'verified' | 'location'>;
  title: string;
  description: string;
  budget: number;
  deadline?: string;
  skills: string[];
  category?: string;
  status: ProjectStatus;
  _count?: { proposals: number };
  createdAt: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  project?: Project;
  developerId: string;
  developer?: Developer;
  coverLetter: string;
  budget: number;
  timeline: number;
  status: ProposalStatus;
  createdAt: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  dueDate?: string;
  order: number;
}

export interface Contract {
  id: string;
  projectId: string;
  project?: Project;
  milestones: Milestone[];
  status: ContractStatus;
  platformFee: number;
  createdAt: string;
}
