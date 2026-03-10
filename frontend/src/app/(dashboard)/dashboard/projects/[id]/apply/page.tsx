'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { ArrowLeft, Send, Plus, Trash2, DollarSign, Clock } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { useSubmitProposal } from '@/hooks/use-proposals';
import { proposalSchema, type ProposalFormData } from '@/schemas/proposal.schema';

export default function ApplyToProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: project, isLoading } = useProject(id);
  const submitProposal = useSubmitProposal(id);

  // Truco para evitar el error de TypeScript con el reset()
  const defaultValues: any = {
    coverLetter: '',
    budget: '' as unknown as number,
    timeline: '' as unknown as number,
    milestonePlan: [{ title: '', description: '', amount: 0, order: 1 }]
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<ProposalFormData>({ 
    resolver: zodResolver(proposalSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestonePlan",
  });

  // Calcula el total de los hitos en tiempo real
  const watchMilestones = watch('milestonePlan');
  const totalMilestonesCost = watchMilestones?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

  const handleApply = (data: ProposalFormData) => {
    const plan = data.milestonePlan || [];
    const formattedData = {
      ...data,
      milestonePlan: plan.map((milestone, index) => ({
        ...milestone,
        order: index + 1
      }))
    };

    submitProposal.mutateAsync(formattedData)
      .then(() => {
        router.push('/dashboard/proposals'); // Redirigir al historial de propuestas
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error al enviar la propuesta';
        setError('root', { message: msg });
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center text-gray-500">Proyecto no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Volver al proyecto
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Armar Propuesta Oficial</h1>
        <p className="text-sm text-gray-500 mt-1">Estás postulando a: <span className="font-semibold text-gray-700">{project.title}</span></p>
      </div>

      <form onSubmit={handleSubmit(handleApply)} className="space-y-6">
        {/* --- Sección General --- */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">1. Detalles Generales</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carta de presentación <span className="text-gray-400 font-normal">(mín. 100 caracteres)</span>
            </label>
            <textarea
              {...register('coverLetter')}
              rows={6}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              placeholder="Hola, me interesa mucho este proyecto. Mi plan para abordarlo es el siguiente..."
            />
            {errors.coverLetter && <p className="mt-1 text-xs text-red-500">{errors.coverLetter.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Total Estimado</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><DollarSign size={16} /></span>
                <input 
                  {...register('budget')} 
                  type="number" min="1"
                  className="block w-full pl-9 rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-medium"
                  placeholder="Ej. 4500" 
                />
              </div>
              {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (días)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500"><Clock size={16} /></span>
                <input 
                  {...register('timeline')} 
                  type="number" min="1"
                  className="block w-full pl-9 rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm font-medium"
                  placeholder="Ej. 30" 
                />
              </div>
              {errors.timeline && <p className="mt-1 text-xs text-red-500">{errors.timeline.message}</p>}
            </div>
          </div>
        </div>

        {/* --- Sección de Hitos (Milestones) --- */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">2. Plan de Trabajo (Milestones)</h2>
              <p className="text-sm text-gray-500 mt-1">Divide el proyecto en entregables con sus respectivos costos.</p>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 shrink-0">
              <span className="text-xs text-gray-500 block text-right">Suma de entregables</span>
              <span className={`font-bold text-lg ${totalMilestonesCost > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                ${totalMilestonesCost.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start p-5 bg-gray-50/50 border border-gray-200 rounded-xl relative group">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-500 shrink-0 shadow-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la tarea / hito</label>
                    <input 
                      {...register(`milestonePlan.${index}.title` as const)} 
                      placeholder="Ej: Maquetación del Frontend..." 
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white" 
                    />
                    {errors.milestonePlan?.[index]?.title && (
                      <p className="mt-1 text-xs text-red-500">{errors.milestonePlan[index]?.title?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción detallada (opcional)</label>
                    <textarea 
                      {...register(`milestonePlan.${index}.description` as const)} 
                      rows={2}
                      placeholder="Qué tareas exactas incluye este paso..." 
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white text-gray-600" 
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-40 shrink-0">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Costo (USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">$</span>
                    <input 
                      type="number" 
                      {...register(`milestonePlan.${index}.amount` as const)} 
                      placeholder="Monto" 
                      className="block w-full pl-7 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm bg-white font-medium" 
                    />
                  </div>
                  {errors.milestonePlan?.[index]?.amount && (
                    <p className="mt-1 text-xs text-red-500">{errors.milestonePlan[index]?.amount?.message}</p>
                  )}
                </div>

                {fields.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => remove(index)} 
                    className="md:mt-6 text-gray-400 hover:text-red-500 transition-colors self-end md:self-auto"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.milestonePlan && !Array.isArray(errors.milestonePlan) && (
            <p className="mt-3 text-sm font-medium text-red-500">{errors.milestonePlan.message}</p>
          )}

          <button 
            type="button" 
            onClick={() => append({ title: '', description: '', amount: 0, order: fields.length + 1 })} 
            className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:text-primary-700 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer w-full justify-center"
          >
            <Plus size={18} /> Añadir otra fase de pago
          </button>
        </div>

        {errors.root && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-primary-600 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            {isSubmitting
              ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
              : <><Send size={18} /> Enviar Propuesta Oficial</>}
          </button>
        </div>
      </form>
    </div>
  );
}