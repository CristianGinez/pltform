export type Role = 'COMPANY' | 'DEVELOPER' | 'ADMIN';
export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PAID';

// ─── Core entities ────────────────────────────────────────────────────────

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
  verificationStatus?: VerificationStatus;
  verificationDocUrl?: string;
  verificationNotes?: string;
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
  disputeLosses?: number;
  verified: boolean;
  verificationStatus?: VerificationStatus;
  verificationDocUrl?: string;
  verificationDocType?: string;
  verificationNotes?: string;
  ruc?: string;
  warrantyDays?: number;
}

// ─── Project ──────────────────────────────────────────────────────────────

/** Company fields returned in project listing endpoints */
export interface ProjectCompanySummary {
  id: string;
  name: string;
  logoUrl?: string;
  verified: boolean;
  location?: string;
  clientRating: number;
  clientReviewCount: number;
}

/** Project as returned by GET /projects (listing) */
export interface Project {
  id: string;
  companyId: string;
  company: ProjectCompanySummary;
  title: string;
  description: string;
  budget: number;
  deadline?: string;
  skills: string[];
  category?: string;
  status: ProjectStatus;
  _count?: { proposals: number };
  contract?: { id: string; status: ContractStatus };
  createdAt: string;
}

/** Project as returned by GET /projects/:id (detail — includes full company + proposals) */
export interface ProjectDetail extends Omit<Project, 'company'> {
  company: Company;
  proposals: ProposalWithDeveloper[];
}

// ─── Proposal ─────────────────────────────────────────────────────────────

export interface ProposalMilestone {
  title: string;
  description?: string;
  amount: number;
  order: number;
}

/** Developer fields included in proposal responses */
export interface ProposalDeveloper extends Developer {
  user?: { id: string };
}

/** Proposal with its developer (as returned inside project detail) */
export interface ProposalWithDeveloper {
  id: string;
  projectId: string;
  developerId: string;
  developer: ProposalDeveloper;
  coverLetter: string;
  budget: number;
  timeline: number;
  status: ProposalStatus;
  milestonePlan?: ProposalMilestone[];
  createdAt: string;
}

/** Proposal as returned by GET /proposals/my (includes project with contract) */
export interface Proposal {
  id: string;
  projectId: string;
  project?: Project & {
    company: { name: string; logoUrl?: string };
    contract?: { id: string; status: ContractStatus };
  };
  developerId: string;
  developer?: Developer;
  coverLetter: string;
  budget: number;
  timeline: number;
  status: ProposalStatus;
  milestonePlan?: ProposalMilestone[];
  createdAt: string;
}

// ─── Contract ─────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  dueDate?: string;
  order: number;
  deliveryNote?: string;
  deliveryLink?: string;
  startedAt?: string;
  submittedAt?: string;
}

export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** Company fields returned inside contract detail */
export interface ContractCompanyInfo {
  id: string;
  name: string;
  userId: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
}

/** Developer fields returned inside contract detail */
export interface ContractDeveloperInfo {
  id: string;
  name: string;
  userId: string;
  avatarUrl?: string;
  skills: string[];
  rating: number;
  trustPoints: number;
}

/** Contract as returned by GET /contracts/:id (the full detail response) */
export interface Contract {
  id: string;
  projectId: string;
  project: {
    id: string;
    title: string;
    status: ProjectStatus;
    company: ContractCompanyInfo;
    proposals: Array<{
      developer: ContractDeveloperInfo;
    }>;
  };
  milestones: Milestone[];
  reviews: Review[];
  status: ContractStatus;
  platformFee: number;
  disputeReason?: string;
  disputeOpenedById?: string;
  disputeResolvedComment?: string;
  disputeOutcome?: 'dev_wins' | 'company_wins' | 'mutual';
  createdAt: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'EVENT' | 'PROPOSAL';
export type MessageProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

export interface ContractMessage {
  id: string;
  contractId: string;
  content: string;
  type: MessageType;
  metadata?: {
    action?: string;
    proposalStatus?: MessageProposalStatus;
    milestoneId?: string;
    milestoneTitle?: string;
    deliveryNote?: string;
    deliveryLink?: string;
    reason?: string;
    amount?: string;
    adminComment?: string;
    isCounter?: boolean;
    replyTo?: string;
    milestones?: Array<{ title: string; description?: string; amount: number; order: number }>;
  } | null;
  createdAt: string;
  sender: {
    id: string;
    role: Role;
    company?: { name: string } | null;
    developer?: { name: string } | null;
  };
}

// ─── Notifications ────────────────────────────────────────────────────────

export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_WITHDRAWN'
  | 'CONTRACT_CREATED'
  | 'MILESTONE_SUBMITTED'
  | 'MILESTONE_APPROVED'
  | 'MILESTONE_STARTED'
  | 'MILESTONE_REVISION_REQUESTED'
  | 'MILESTONE_PAID'
  | 'CONTRACT_COMPLETED'
  | 'MESSAGE_RECEIVED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED'
  | 'VERIFICATION_SUBMITTED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
  createdAt: string;
  user?: { email: string; role: Role };
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
