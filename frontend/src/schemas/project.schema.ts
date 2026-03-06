import { z } from 'zod';

export const projectSchema = z.object({
  title:       z.string().min(10, 'Mínimo 10 caracteres'),
  description: z.string().min(50, 'Mínimo 50 caracteres'),
  budget:      z.coerce.number().min(1, 'Ingresa un presupuesto'),
  deadline:    z.string().optional(),
  category:    z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
