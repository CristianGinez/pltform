import React from 'react';
import {
  CheckCircle, Circle, Clock, AlertCircle,
  Rocket, Send, RotateCcw, DollarSign, PartyPopper,
  Activity, Eye, ShieldAlert, Ban,
} from 'lucide-react';
import type { MilestoneStatus } from '@/types';

// ─── Milestone status icon ────────────────────────────────────────────────────

export function MilestoneStatusIcon({ status, size = 16 }: { status: MilestoneStatus; size?: number }) {
  switch (status) {
    case 'PAID': case 'APPROVED': return <CheckCircle size={size} className="text-emerald-600" />;
    case 'SUBMITTED': return <Clock size={size} className="text-yellow-600" />;
    case 'REVISION_REQUESTED': return <AlertCircle size={size} className="text-orange-600" />;
    case 'IN_PROGRESS': return <Clock size={size} className="text-blue-500" />;
    default: return <Circle size={size} className="text-gray-300" />;
  }
}

// ─── Event icon ───────────────────────────────────────────────────────────────

export function EventIcon({ action }: { action?: string }) {
  switch (action) {
    case 'MILESTONE_STARTED':    return <Rocket size={14} className="text-blue-500" />;
    case 'MILESTONE_SUBMITTED':  return <Send size={14} className="text-yellow-600" />;
    case 'MILESTONE_REVISION_REQUESTED': return <RotateCcw size={14} className="text-orange-500" />;
    case 'MILESTONE_PAID':       return <DollarSign size={14} className="text-emerald-600" />;
    case 'CONTRACT_COMPLETED':   return <PartyPopper size={14} className="text-purple-500" />;
    case 'PROGRESS_UPDATE':      return <Activity size={14} className="text-blue-400" />;
    case 'READY_FOR_TESTING':    return <Eye size={14} className="text-purple-500" />;
    case 'DISPUTE_OPENED':       return <ShieldAlert size={14} className="text-red-500" />;
    case 'DISPUTE_RESOLVED':     return <CheckCircle size={14} className="text-green-600" />;
    case 'CONTRACT_CANCELLED_MUTUAL': return <Ban size={14} className="text-gray-500" />;
    default:                     return <CheckCircle size={14} className="text-gray-400" />;
  }
}

// ─── Dispute status label helper ──────────────────────────────────────────────

export function getDisputeStatusLabel(
  contract: { status: string; disputeOutcome?: string | null },
  isCompany: boolean,
): { label: string; color: string } | null {
  if (!contract.disputeOutcome) return null;
  const o = contract.disputeOutcome;
  if (o === 'mutual') return { label: 'Cancelación mutua', color: 'bg-gray-100 text-gray-600' };
  const devWins = o === 'dev_wins';
  const userWins = isCompany ? !devWins : devWins;
  return userWins
    ? { label: 'Resuelto a tu favor', color: 'bg-green-50 text-green-700' }
    : { label: 'Resuelto en tu contra', color: 'bg-red-50 text-red-700' };
}
