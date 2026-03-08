import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { Project, Proposal } from '@/types';
import type { ProjectFormData } from '@/schemas/project.schema';

export function useMyProjects() {
  return useQuery<Project[]>({
    queryKey: ['my-projects'],
    queryFn: () => api.get('/projects/my').then((r) => r.data),
  });
}

export function usePublicProjects() {
  return useQuery<Project[]>({
    queryKey: ['public-projects'],
    queryFn: () => api.get('/projects?status=OPEN').then((r) => r.data),
  });
}

export function useProject(id: string) {
  return useQuery<Project & { proposals: Proposal[] }>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectFormData & { skills: string[] }) =>
      api.post('/projects', {
        ...data,
        deadline: data.deadline || undefined,
        category: data.category || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      toast.success('Proyecto creado exitosamente');
    },
    onError: () => toast.error('Error al crear el proyecto'),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProjectFormData> & { skills?: string[] }) =>
      api.patch(`/projects/${id}`, {
        ...data,
        deadline: data.deadline || undefined,
        category: data.category || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Proyecto actualizado');
    },
    onError: () => toast.error('Error al actualizar el proyecto'),
  });
}

export function usePublishProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(`/projects/${id}/publish`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Proyecto publicado — ya visible para developers');
    },
    onError: () => toast.error('Error al publicar el proyecto'),
  });
}

export function useAcceptProposal(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) =>
      api.patch(`/proposals/${proposalId}/accept`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      toast.success('Propuesta aceptada — se creó el contrato');
    },
    onError: () => toast.error('Error al aceptar la propuesta'),
  });
}
