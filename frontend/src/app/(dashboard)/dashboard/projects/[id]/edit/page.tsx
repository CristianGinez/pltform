'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Clock, Plus, X, AlertCircle } from 'lucide-react';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { projectSchema, type ProjectFormData } from '@/schemas/project.schema';

const CATEGORIES = ['Web', 'Mobile', 'E-commerce', 'SaaS', 'API / Backend', 'Data / Analytics', 'Automatización', 'Diseño UI/UX', 'Otro'];

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const mutation = useUpdateProject(id);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        budget: project.budget as unknown as number,
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        category: project.category ?? '',
      });
      setSkills(project.skills ?? []);
    }
  }, [project, reset]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const handleSave = (data: ProjectFormData) =>
    mutation.mutateAsync({ ...data, skills }).then(() =>
      router.push(`/dashboard/projects/${id}`)
    );

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-6">
        <ArrowLeft size={15} /> Volver al proyecto
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar proyecto</h1>
        <p className="text-sm text-gray-500 mt-1">Modifica los detalles del borrador antes de publicarlo.</p>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input {...register('title')} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea {...register('description')} rows={5} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><DollarSign size={13} className="text-gray-400" />Presupuesto (S/)</label>
              <input {...register('budget')} type="number" min="1" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
              {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock size={13} className="text-gray-400" />Fecha límite <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input {...register('deadline')} type="date" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select {...register('category')} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm">
              <option value="">Sin categoría específica</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tecnologías requeridas <span className="text-gray-400 font-normal">(opcional)</span></label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm" placeholder="Ej: React, Node.js" />
              <button type="button" onClick={addSkill} className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <Plus size={13} />Agregar
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {mutation.isError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle size={14} />Error al guardar los cambios.
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer">
            {mutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
