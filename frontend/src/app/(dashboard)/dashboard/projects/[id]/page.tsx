'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, DollarSign, Users, Tag, Edit, Send, PlayCircle, X,
  CheckCircle, Star, ShieldCheck, Layers, ChevronRight, Calendar, PartyPopper,
} from 'lucide-react';
import { useProject, usePublishProject, useAcceptProposal } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth.store';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 'md' }: { name?: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${dims} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${dims} rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0`}>
      {name?.charAt(0)?.toUpperCase() ?? 'D'}
    </div>
  );
}

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={11} className="fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── Company Card (developer view) ────────────────────────────────────────────

function CompanyCard({ company }: { company: any }) {
  return (
    <Link href={`/companies/${company.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-primary-200 hover:shadow-md transition-all">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Empresa</p>
        <div className="flex items-center gap-4">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-700 font-bold text-xl flex items-center justify-center shrink-0">
              {company.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{company.name}</span>
              {company.verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck size={9} />Verificada
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
              {company.industry && <span>{company.industry}</span>}
              {company.location && <span>· {company.location}</span>}
              {company.size && <span>· {company.size}</span>}
            </div>
            {company.clientRating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-gray-700">{company.clientRating.toFixed(1)}</span>
                {company.clientReviewCount > 0 && (
                  <span className="text-xs text-gray-400">({company.clientReviewCount} reseñas)</span>
                )}
              </div>
            )}
          </div>
          <ChevronRight size={15} className="text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" />
        </div>
        {company.description && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed line-clamp-2">{company.description}</p>
        )}
      </div>
    </Link>
  );
}

// ─── My Proposal Card (developer view) ────────────────────────────────────────

function MyProposalCard({ prop }: { prop: any }) {
  const hasPlan = Array.isArray(prop.milestonePlan) && prop.milestonePlan.length > 0;
  const totalPlan = hasPlan
    ? prop.milestonePlan.reduce((s: number, m: any) => s + Number(m.amount ?? 0), 0)
    : 0;

  const STATUS_CFG: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Pendiente',  color: 'bg-yellow-50 text-yellow-700' },
    ACCEPTED:  { label: 'Aceptada',   color: 'bg-green-50 text-green-700'  },
    REJECTED:  { label: 'Rechazada',  color: 'bg-red-50 text-red-600'      },
    WITHDRAWN: { label: 'Retirada',   color: 'bg-gray-100 text-gray-500'   },
  };
  const cfg = STATUS_CFG[prop.status] ?? STATUS_CFG.PENDING;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-gray-900">Mi propuesta</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-xs text-primary-600 font-medium mb-0.5 flex items-center gap-1">
            <DollarSign size={11} />Presupuesto
          </p>
          <p className="text-xl font-bold text-primary-700">S/ {Number(prop.budget).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
            <Calendar size={11} />Plazo
          </p>
          <p className="text-xl font-bold text-gray-900">{prop.timeline} días</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Carta de presentación</p>
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {prop.coverLetter}
        </div>
      </div>

      {hasPlan && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Layers size={12} />Plan de milestones
            </p>
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
              {prop.milestonePlan.length} tareas · S/ {totalPlan.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2">
            {prop.milestonePlan.map((m: any, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{m.title}</p>
                  {m.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{m.description}</p>}
                </div>
                <span className="text-sm font-bold text-primary-700 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Enviada el {new Date(prop.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

// ─── Proposal Card ─────────────────────────────────────────────────────────────

function ProposalCard({ prop, onSelect }: { prop: any; onSelect: () => void }) {
  const dev = prop.developer;
  const avatarUrl = dev?.avatarUrl ?? dev?.user?.avatarUrl;
  const name = dev?.user?.name ?? 'Desarrollador';
  const title = dev?.title;
  const rating = dev?.rating;
  const verified = dev?.verified;
  const trustPoints = dev?.trustPoints;
  const skills: string[] = dev?.skills ?? [];
  const hasMilestonePlan = Array.isArray(prop.milestonePlan) && prop.milestonePlan.length > 0;

  return (
    <div
      onClick={onSelect}
      className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} avatarUrl={avatarUrl} size="md" />

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{name}</span>
            {verified && <ShieldCheck size={13} className="text-blue-500 shrink-0" />}
            <Stars rating={rating} />
            {trustPoints != null && trustPoints > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                {trustPoints} pts
              </span>
            )}
          </div>

          {title && <p className="text-xs text-gray-400 mt-0.5 truncate">{title}</p>}

          {/* Budget + timeline */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-bold text-primary-700">
              S/ {Number(prop.budget).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} />{prop.timeline} días
            </span>
            {hasMilestonePlan && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Layers size={10} />{prop.milestonePlan.length} milestones
              </span>
            )}
          </div>

          {/* Cover letter preview */}
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {prop.coverLetter}
          </p>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.slice(0, 4).map((s: string) => (
                <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>
              ))}
              {skills.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">+{skills.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <ChevronRight size={15} className="text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ─── Proposal Modal ────────────────────────────────────────────────────────────

type ModalStep = 'detail' | 'confirm' | 'success';

function ProposalModal({ prop, projectId, onClose, onAccepted }: {
  prop: any; projectId: string; onClose: () => void; onAccepted: (contractId: string) => void;
}) {
  const [step, setStep] = useState<ModalStep>('detail');
  const [contractId, setContractId] = useState<string>('');

  const acceptProposal = useAcceptProposal(projectId, (cid) => {
    setContractId(cid);
    setStep('success');
  });

  const dev = prop.developer;
  const avatarUrl = dev?.avatarUrl ?? dev?.user?.avatarUrl;
  const name = dev?.user?.name ?? dev?.name ?? 'Desarrollador';
  const title = dev?.title;
  const bio = dev?.bio;
  const rating = dev?.rating;
  const reviewCount = dev?.reviewCount;
  const verified = dev?.verified;
  const trustPoints = dev?.trustPoints;
  const skills: string[] = dev?.skills ?? [];
  const location = dev?.location;
  const university = dev?.university;
  const hourlyRate = dev?.hourlyRate;
  const hasPlan = Array.isArray(prop.milestonePlan) && prop.milestonePlan.length > 0;
  const totalPlan = hasPlan
    ? prop.milestonePlan.reduce((sum: number, m: any) => sum + Number(m.amount ?? 0), 0)
    : 0;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {step === 'confirm' && (
              <button onClick={() => setStep('detail')} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer mr-1">
                <ArrowLeft size={16} className="text-gray-400" />
              </button>
            )}
            <h2 className="font-semibold text-gray-900">
              {step === 'detail' ? 'Propuesta recibida' : step === 'confirm' ? 'Confirmar aceptación' : '¡Propuesta aceptada!'}
            </h2>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Animated body */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={step === 'confirm' ? 1 : -1}>
            {/* ── Step 1: Detail ── */}
            {step === 'detail' && (
              <motion.div key="detail" custom={-1} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-y-auto h-full px-5 py-5 space-y-5"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={name} avatarUrl={avatarUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{name}</h3>
                      {verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} />Verificado
                        </span>
                      )}
                    </div>
                    {title && <p className="text-sm text-gray-500 mt-0.5">{title}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                      {rating != null && (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
                        </span>
                      )}
                      {trustPoints != null && trustPoints > 0 && <span className="font-semibold text-emerald-700">{trustPoints} pts</span>}
                      {location && <span>{location}</span>}
                      {university && <span>{university}</span>}
                      {hourlyRate && <span>S/ {Number(hourlyRate).toLocaleString()}/hr</span>}
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {skills.map((s: string) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {bio && <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">{bio}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <p className="text-xs text-primary-600 font-medium mb-0.5 flex items-center gap-1"><DollarSign size={11} />Presupuesto</p>
                    <p className="text-xl font-bold text-primary-700">S/ {Number(prop.budget).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1"><Calendar size={11} />Plazo</p>
                    <p className="text-xl font-bold text-gray-900">{prop.timeline} días</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Carta de presentación</h4>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{prop.coverLetter}</div>
                </div>

                {hasPlan && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5"><Layers size={12} />Plan de trabajo</h4>
                      <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">{prop.milestonePlan.length} milestones · S/ {totalPlan.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      {prop.milestonePlan.map((m: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{m.title}</p>
                            {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
                          </div>
                          <span className="text-sm font-bold text-primary-700 shrink-0">S/ {Number(m.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Confirm ── */}
            {step === 'confirm' && (
              <motion.div key="confirm" custom={1} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex flex-col items-center justify-center h-full px-8 py-10 text-center gap-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-1">
                  <Avatar name={name} avatarUrl={avatarUrl} size="lg" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">¿Aceptar la propuesta de {name}?</p>
                  <p className="text-sm text-gray-500 mt-1">Se creará el contrato y comenzará el chat con el developer.</p>
                </div>
                <div className="w-full max-w-sm bg-gray-50 rounded-2xl border border-gray-100 p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Developer</span>
                    <span className="font-semibold text-gray-900">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Presupuesto</span>
                    <span className="font-semibold text-primary-700">S/ {Number(prop.budget).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plazo</span>
                    <span className="font-semibold text-gray-900">{prop.timeline} días</span>
                  </div>
                  {hasPlan && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Milestones</span>
                      <span className="font-semibold text-gray-900">{prop.milestonePlan.length} tareas</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                  <button onClick={() => setStep('detail')}
                    className="flex-1 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    onClick={() => acceptProposal.mutate(prop.id)}
                    disabled={acceptProposal.isPending}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {acceptProposal.isPending
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando...</>
                      : <><CheckCircle size={15} />Confirmar</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success ── */}
            {step === 'success' && (
              <motion.div key="success" custom={1} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center h-full px-8 py-10 text-center gap-5"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <PartyPopper size={36} className="text-emerald-600" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <p className="text-xl font-bold text-gray-900">¡Propuesta aceptada!</p>
                  <p className="text-sm text-gray-500 mt-1">El contrato con {name} ha sido creado. Ahora pueden coordinarse por el chat.</p>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  onClick={() => onAccepted(contractId)}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send size={15} />Ir al contrato y chat
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer (solo en detail) */}
        {step === 'detail' && (
          <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 bg-white shrink-0">
            <Link href={`/developers/${dev?.id ?? ''}`} className="text-xs text-gray-400 hover:text-primary-600 transition-colors" onClick={onClose}>
              Ver perfil completo →
            </Link>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                Cerrar
              </button>
              {prop.status === 'PENDING' && (
                <button onClick={() => setStep('confirm')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors cursor-pointer flex items-center gap-2">
                  <CheckCircle size={15} />Aceptar propuesta
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const isCompany = user?.role === 'COMPANY';

  const { data: project, isLoading } = useProject(id);
  const publishMutation = usePublishProject(id);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-32 text-gray-400">
        Proyecto no encontrado.{' '}
        <Link href="/dashboard/projects" className="text-primary-600 hover:underline">Volver</Link>
      </div>
    );
  }

  // Developer: find their own proposal
  const myProposal = !isCompany
    ? project.proposals?.find((p: any) => p.developer?.userId === user?.id || p.developer?.user?.id === user?.id)
    : null;

  const pendingProposals = project.proposals?.filter((p: any) => p.status === 'PENDING') ?? [];
  const otherProposals = project.proposals?.filter((p: any) => p.status !== 'PENDING') ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <button
        onClick={() => router.push(isCompany ? '/dashboard/projects' : '/dashboard/proposals')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> {isCompany ? 'Volver a mis proyectos' : 'Volver a mis propuestas'}
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: project details + proposals ── */}
        <div className="flex-1 min-w-0 space-y-5 w-full">

          {/* Project card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {project.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full mb-2">
                    <Tag size={10} /> {project.category}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900 leading-snug [overflow-wrap:anywhere]">{project.title}</h1>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                <DollarSign size={15} className="text-gray-400" />
                S/ {Number(project.budget).toLocaleString()}
              </span>
              {project.deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Fecha límite: {new Date(project.deadline).toLocaleDateString('es-PE')}
                </span>
              )}
            </div>

            {project.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {project.skills.map((s: string) => (
                  <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{project.description}</p>
            </div>
          </div>

          {/* Developer: my proposal */}
          {!isCompany && myProposal && <MyProposalCard prop={myProposal} />}

          {/* Company: received proposals */}
          {isCompany && project.proposals && project.proposals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Propuestas recibidas
                  <span className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {project.proposals.length}
                  </span>
                </h3>
                {pendingProposals.length > 0 && (
                  <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full font-medium">
                    {pendingProposals.length} pendiente{pendingProposals.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {pendingProposals.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Esperando respuesta</p>
                  <div className="space-y-2">
                    {pendingProposals.map((prop: any) => (
                      <ProposalCard key={prop.id} prop={prop} onSelect={() => setSelectedProposal(prop)} />
                    ))}
                  </div>
                </div>
              )}

              {otherProposals.length > 0 && (
                <div>
                  {pendingProposals.length > 0 && <div className="border-t border-gray-100 mb-4" />}
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Otras</p>
                  <div className="space-y-2">
                    {otherProposals.map((prop: any) => (
                      <ProposalCard key={prop.id} prop={prop} onSelect={() => setSelectedProposal(prop)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">

          {/* Developer: company card */}
          {!isCompany && project.company && <CompanyCard company={project.company} />}

          {/* Company: actions + stats */}
          {isCompany && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Acciones</h3>
                <div className="space-y-2.5">
                  {project.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => {
                          if (confirm('¿Publicar este proyecto? Los developers podrán enviar propuestas.')) publishMutation.mutate();
                        }}
                        disabled={publishMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {publishMutation.isPending
                          ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Send size={14} />}
                        Publicar proyecto
                      </button>
                      <Link href={`/dashboard/projects/${project.id}/edit`} className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Edit size={14} /> Editar borrador
                      </Link>
                    </>
                  )}
                  {project.status === 'IN_PROGRESS' && project.contract && (
                    <Link href={`/dashboard/contracts/${project.contract.id}`} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                      <PlayCircle size={14} /> Ir al contrato
                    </Link>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estadísticas</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5"><Users size={14} /> Postulantes</span>
                  <span className="font-bold text-gray-900">{project._count?.proposals ?? project.proposals?.length ?? 0}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedProposal && (
        <ProposalModal
          prop={selectedProposal}
          projectId={id}
          onClose={() => setSelectedProposal(null)}
          onAccepted={(contractId) => router.push(`/dashboard/contracts/${contractId}`)}
        />
      )}
    </div>
  );
}
