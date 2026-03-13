import type { MilestoneStatus } from '@/types';
import React from 'react';
import { Rocket, Send, RotateCcw, ThumbsUp, Ban, ListChecks } from 'lucide-react';

// ─── Milestone status labels/colors ───────────────────────────────────────────

export const STATUS_LABELS: Record<MilestoneStatus, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En progreso', SUBMITTED: 'Entregado',
  REVISION_REQUESTED: 'Revisión', APPROVED: 'Aprobado', PAID: 'Pagado',
};

export const STATUS_COLORS: Record<MilestoneStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700', REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700', PAID: 'bg-emerald-100 text-emerald-700',
};

export const STEP_COLORS: Record<MilestoneStatus, { leftBorder: string; bg: string }> = {
  PENDING:            { leftBorder: 'border-l-gray-200',   bg: 'bg-white' },
  IN_PROGRESS:        { leftBorder: 'border-l-blue-400',   bg: 'bg-blue-50/40' },
  SUBMITTED:          { leftBorder: 'border-l-yellow-400', bg: 'bg-yellow-50/40' },
  REVISION_REQUESTED: { leftBorder: 'border-l-orange-400', bg: 'bg-orange-50/40' },
  APPROVED:           { leftBorder: 'border-l-green-400',  bg: 'bg-green-50/30' },
  PAID:               { leftBorder: 'border-l-emerald-400',bg: 'bg-emerald-50/30' },
};

// ─── Event colors ──────────────────────────────────────────────────────────────

export const EVENT_COLORS: Record<string, string> = {
  MILESTONE_STARTED: 'bg-blue-50 border-blue-200 text-blue-800',
  MILESTONE_SUBMITTED: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  MILESTONE_REVISION_REQUESTED: 'bg-orange-50 border-orange-200 text-orange-800',
  MILESTONE_PAID: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  CONTRACT_COMPLETED: 'bg-purple-50 border-purple-200 text-purple-800',
  PROGRESS_UPDATE: 'bg-sky-50 border-sky-200 text-sky-800',
  READY_FOR_TESTING: 'bg-purple-50 border-purple-200 text-purple-800',
  DISPUTE_OPENED: 'bg-red-50 border-red-200 text-red-800',
  DISPUTE_RESOLVED: 'bg-green-50 border-green-200 text-green-800',
  CONTRACT_CANCELLED_MUTUAL: 'bg-gray-50 border-gray-200 text-gray-700',
};

// ─── Proposal action labels ───────────────────────────────────────────────────

export const PROPOSAL_LABELS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  PROPOSE_START:    { icon: React.createElement(Rocket, { size: 14 }),    label: 'Propone iniciar',   color: 'text-blue-700' },
  PROPOSE_SUBMIT:   { icon: React.createElement(Send, { size: 14 }),      label: 'Propone entregar',  color: 'text-yellow-700' },
  PROPOSE_REVISION: { icon: React.createElement(RotateCcw, { size: 14 }), label: 'Pide revisión',     color: 'text-orange-700' },
  PROPOSE_APPROVE:  { icon: React.createElement(ThumbsUp, { size: 14 }),  label: 'Propone aprobar',   color: 'text-green-700' },
  PROPOSE_CANCEL:   { icon: React.createElement(Ban, { size: 14 }),        label: 'Propone cancelar',  color: 'text-gray-600' },
  PROPOSE_MILESTONE_PLAN: { icon: React.createElement(ListChecks, { size: 14 }), label: 'Plan de milestones', color: 'text-primary-700' },
};

// ─── Contract status labels/colors ────────────────────────────────────────────

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', COMPLETED: 'Completado', DISPUTED: 'En disputa', CANCELLED: 'Cancelado',
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700', COMPLETED: 'bg-green-50 text-green-700',
  DISPUTED: 'bg-red-50 text-red-700', CANCELLED: 'bg-gray-100 text-gray-600',
};

// ─── Tab types ────────────────────────────────────────────────────────────────

export type Tab = 'chat' | 'milestones' | 'resumen';
export const TAB_ORDER: Tab[] = ['chat', 'milestones', 'resumen'];
