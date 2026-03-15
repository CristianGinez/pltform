'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, X, DollarSign, Clock, ListChecks, CheckCircle } from 'lucide-react';
import { useSubmitProposal } from '@/hooks/use-proposals';
import { proposalSchema, type ProposalFormData } from '@/schemas/proposal.schema';

interface ProposalFormProps {
  projectId: string;
  projectBudget?: number;
  onSuccess?: () => void;
}

export function ProposalForm({ projectId, projectBudget, onSuccess }: ProposalFormProps) {
  const submitProposal = useSubmitProposal(projectId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      coverLetter: '',
      budget: '' as unknown as number,
      timeline: '' as unknown as number,
      milestonePlan: [{ title: '', description: '', amount: 0, order: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'milestonePlan' });

  const watchMilestones = watch('milestonePlan');
  const milestoneTotal = watchMilestones?.reduce((s, m) => s + (Number(m.amount) || 0), 0) || 0;

  // Auto-sync presupuesto con la suma de milestones
  useEffect(() => {
    if (milestoneTotal > 0) {
      setValue('budget', milestoneTotal, { shouldValidate: false });
    }
  }, [milestoneTotal, setValue]);

  if (submitProposal.isSuccess) {
    if (onSuccess) { onSuccess(); return null; }
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900 text-xl">¡Propuesta enviada!</p>
        <p className="text-sm text-gray-500 mt-1">La empresa revisará tu propuesta y te contactará pronto.</p>
        <Link href="/dashboard/proposals" className="mt-4 inline-block text-sm text-primary-600 hover:underline font-medium">
          Ver mis propuestas →
        </Link>
      </div>
    );
  }

  const handleApply = (data: ProposalFormData) => {
    const plan = (data.milestonePlan || []).map((m, i) => ({
      ...m,
      order: i + 1,
      description: m.description || undefined,
    }));
    submitProposal.mutateAsync({ ...data, milestonePlan: plan }).catch((err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al enviar la propuesta';
      setError('root', { message: msg });
    });
  };

  return (
    <form onSubmit={handleSubmit(handleApply)} className="space-y-5">
      {/* Cover letter */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          Carta de presentación <span className="text-red-400">*</span>
          <span className="text-gray-400 font-normal ml-1">(mín. 100 caracteres)</span>
        </label>
        <textarea
          {...register('coverLetter')}
          rows={5}
          placeholder="Preséntate y explica por qué eres la mejor opción para este proyecto. Menciona tu experiencia relevante, enfoque técnico y cómo vas a resolver el problema..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        {errors.coverLetter && <p className="mt-1 text-xs text-red-500">{errors.coverLetter.message}</p>}
      </div>

      {/* Budget + Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Tu presupuesto (S/) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"><DollarSign size={14} /></span>
            <input
              {...register('budget')}
              type="number" min="1"
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {projectBudget && projectBudget > 0 && (
            <p className="text-xs text-gray-400 mt-1">Proyecto: S/ {Number(projectBudget).toLocaleString()}</p>
          )}
          {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Tiempo estimado (días) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={14} /></span>
            <input
              {...register('timeline')}
              type="number" min="1"
              placeholder="30"
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {errors.timeline && <p className="mt-1 text-xs text-red-500">{errors.timeline.message}</p>}
        </div>
      </div>

      {/* Milestone plan */}
      <div className="border border-primary-100 bg-primary-50/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">Plan de milestones</span>
          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Recomendado</span>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Define las etapas del proyecto con sus montos. Esto muestra a la empresa tu plan de trabajo y genera más confianza.
        </p>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-white border border-gray-100 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Tarea {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 cursor-pointer">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <input
                  {...register(`milestonePlan.${index}.title` as const)}
                  placeholder="Título *"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.milestonePlan?.[index]?.title && (
                  <p className="text-xs text-red-500">{errors.milestonePlan[index]?.title?.message}</p>
                )}
                <textarea
                  {...register(`milestonePlan.${index}.description` as const)}
                  placeholder="Descripción (opcional)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 shrink-0">S/</span>
                  <input
                    {...register(`milestonePlan.${index}.amount` as const)}
                    type="number" min="1" placeholder="Monto *"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {errors.milestonePlan?.[index]?.amount && (
                  <p className="text-xs text-red-500">{errors.milestonePlan[index]?.amount?.message}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => append({ title: '', description: '', amount: 0, order: fields.length + 1 })}
          className="mt-3 w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Plus size={13} /> Añadir tarea
        </button>

        {milestoneTotal > 0 && (
          <div className="flex justify-between text-xs text-gray-500 px-1 mt-2">
            <span>Total del plan</span>
            <span className="font-semibold text-gray-700">S/ {milestoneTotal.toLocaleString()}</span>
          </div>
        )}
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
          {errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</>
          : <><Send size={16} />Enviar propuesta</>}
      </button>
    </form>
  );
}
