'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, DollarSign, Users, Tag, Edit, Send, PlayCircle, Eye, X
} from 'lucide-react';
import { useProject, usePublishProject, useAcceptProposal } from '@/hooks/use-projects';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierto', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};

export default function DashboardProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: project, isLoading } = useProject(id);
  const publishMutation = usePublishProject(id);
  
  // Estado para controlar la modal de propuesta
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  // Hook para aceptar la propuesta (redirige al contrato cuando es exitoso)
  const acceptProposal = useAcceptProposal(id as string, (contractId) => {
    setSelectedProposal(null);
    router.push(`/dashboard/contracts/${contractId}`);
  });

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
        <Link href="/dashboard/projects" className="text-primary-600 hover:underline">
          Volver a mis proyectos
        </Link>
      </div>
    );
  }

  const handlePublish = () => {
    if (confirm('¿Estás seguro de publicar este proyecto? Una vez publicado, los developers podrán enviar sus propuestas.')) {
      publishMutation.mutate();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <button
        onClick={() => router.push('/dashboard/projects')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Volver a mis proyectos
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── IZQUIERDA: Detalles del Proyecto ── */}
        <div className="flex-1 min-w-0 space-y-5 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {project.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full mb-2">
                    <Tag size={10} /> {project.category}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900 leading-snug">{project.title}</h1>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                project.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                project.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                <DollarSign size={15} className="text-gray-400" />
                ${Number(project.budget).toLocaleString()}
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
                  <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción del proyecto</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          </div>

          {/* ── LISTA DE PROPUESTAS RECIBIDAS (Solo visible si hay propuestas) ── */}
          {project.proposals && project.proposals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm w-full mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Propuestas Recibidas 
                <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">{project.proposals.length}</span>
              </h3>
              
              <div className="space-y-4">
                {project.proposals.map((prop: any) => (
                  <div key={prop.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-primary-300 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                        {prop.developer?.user?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{prop.developer?.user?.name || 'Desarrollador'}</p>
                        <p className="text-sm text-gray-500 font-medium">
                          ${Number(prop.budget).toLocaleString()} USD • {prop.timeline} días
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProposal(prop)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Eye size={16} /> Ver Detalles
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DERECHA: Acciones y Estadísticas ── */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Acciones del Proyecto</h3>
            
            <div className="space-y-3">
              {project.status === 'DRAFT' && (
                <>
                  <button 
                    onClick={handlePublish}
                    disabled={publishMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {publishMutation.isPending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Publicar Proyecto
                  </button>
                  <Link href={`/dashboard/projects/${project.id}/edit`} className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Edit size={15} /> Editar Borrador
                  </Link>
                </>
              )}

              {project.status === 'IN_PROGRESS' && project.contract && (
                <Link href={`/dashboard/contracts/${project.contract.id}`} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">
                  <PlayCircle size={15} /> Ir al Contrato
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Estadísticas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Users size={14} /> Postulantes</span>
                <span className="font-bold text-gray-900">{project._count?.proposals || project.proposals?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DE DETALLE DE PROPUESTA ── */}
      {selectedProposal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Cabecera Modal */}
            <div className="bg-white border-b border-gray-100 p-5 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Detalle de Propuesta</h2>
              <button 
                onClick={() => setSelectedProposal(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl shrink-0">
                  {selectedProposal.developer?.user?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">{selectedProposal.developer?.user?.name || 'Desarrollador'}</p>
                  <p className="text-sm text-gray-500">{selectedProposal.developer?.title || 'Profesional Independiente'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Presupuesto Propuesto</p>
                  <p className="text-lg font-bold text-primary-700">${Number(selectedProposal.budget).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Tiempo Estimado</p>
                  <p className="text-lg font-bold text-gray-900">{selectedProposal.timeline} días</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Carta de Presentación</h3>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedProposal.coverLetter}
                </div>
              </div>

              {/* Aquí dibujamos el plan personalizado (Milestones) del developer */}
              {selectedProposal.milestonePlan && Array.isArray(selectedProposal.milestonePlan) && selectedProposal.milestonePlan.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Plan de Trabajo Sugerido (Milestones)</h3>
                    <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                      {selectedProposal.milestonePlan.length} tareas
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedProposal.milestonePlan.map((milestone: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start group hover:border-primary-300 transition-colors">
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-primary-50 group-hover:text-primary-700 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{milestone.title}</p>
                            {milestone.description && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg text-sm shrink-0 whitespace-nowrap">
                          ${Number(milestone.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pie de Modal (Botones) */}
            <div className="border-t border-gray-100 p-5 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button 
                onClick={() => setSelectedProposal(null)} 
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              {selectedProposal.status === 'PENDING' && (
                <button 
                  onClick={() => {
                    if(confirm('¿Estás seguro de aceptar esta propuesta? Se creará el contrato inmediatamente con este plan de trabajo propuesto por el desarrollador.')) {
                      acceptProposal.mutate(selectedProposal.id);
                    }
                  }}
                  disabled={acceptProposal.isPending}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {acceptProposal.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                  ) : (
                    <><CheckCircle size={16} /> Aceptar y Crear Contrato</>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}