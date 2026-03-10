export type Role = 'COMPANY' | 'DEVELOPER' | 'ADMIN';
export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PAID';

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

export interface Project {
  id: string;
  companyId: string;
  company: Pick<Company, 'id' | 'name' | 'logoUrl' | 'verified' | 'location' | 'clientRating' | 'clientReviewCount'>;
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
  deliveryNote?: string;
  deliveryLink?: string;
  startedAt?: string;
  submittedAt?: string;
}

export interface Contract {
  id: string;
  projectId: string;
  project?: Project;
  milestones: Milestone[];
  status: ContractStatus;
  platformFee: number;
  disputeReason?: string;
  disputeOpenedById?: string;
  disputeResolvedComment?: string;
  createdAt: string;
}

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
