'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { ProposalForm } from '@/features/proposals/components/ProposalForm';

export default function ApplyToProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center text-gray-500">Proyecto no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Volver al proyecto
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enviar propuesta</h1>
        <p className="text-sm text-gray-500 mt-1">Postulando a: <span className="font-semibold text-gray-700">{project.title}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <ProposalForm
          projectId={id}
          projectBudget={Number(project.budget)}
          onSuccess={() => router.push('/dashboard/proposals')}
        />
      </div>
    </div>
  );
}
