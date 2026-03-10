import { z } from 'zod';

export const milestonePlanItemSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  amount: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  order: z.number().default(1),
});

export const proposalSchema = z.object({
  coverLetter: z.string().min(100, 'Mínimo 100 caracteres'),
  budget:      z.coerce.number().min(1, 'Ingresa un presupuesto'),
  timeline:    z.coerce.number().min(1, 'Ingresa los días estimados'),
  milestonePlan: z.array(milestonePlanItemSchema).min(1, 'Debes incluir al menos un hito de pago'),
});

export type ProposalFormData = z.infer<typeof proposalSchema>;