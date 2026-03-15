// ─── Shared types and constants for the contracts module ──────────────────────

export const SENDER_SELECT = {
  id: true,
  role: true,
  company: { select: { name: true } },
  developer: { select: { name: true } },
};

export type ProposalAction =
  | 'PROPOSE_START'
  | 'PROPOSE_SUBMIT'
  | 'PROPOSE_REVISION'
  | 'PROPOSE_APPROVE'
  | 'PROPOSE_CANCEL'
  | 'PROPOSE_MILESTONE_PLAN';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

export interface ProposalMetadata {
  action: ProposalAction;
  proposalStatus: ProposalStatus;
  milestoneId: string;
  milestoneTitle: string;
  deliveryNote?: string;
  deliveryLink?: string;
  reason?: string;
  milestones?: Array<{
    title: string;
    description?: string;
    amount: number;
    order: number;
  }>;
}
