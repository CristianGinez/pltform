import { z } from 'zod';

export const proposalSchema = z.object({
  coverLetter: z.string().min(100, 'Mínimo 100 caracteres'),
  budget:      z.coerce.number().min(1, 'Ingresa un presupuesto'),
  timeline:    z.coerce.number().min(1, 'Ingresa los días estimados'),
});

export type ProposalFormData = z.infer<typeof proposalSchema>;
