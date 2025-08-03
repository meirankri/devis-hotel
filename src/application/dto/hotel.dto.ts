import { z } from 'zod';

export const createHotelSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  imageUrl: z.string().url('URL invalide').optional(),
});

export const updateHotelSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255).optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  imageUrl: z.string().url('URL invalide').nullable().optional(),
});

export type CreateHotelDto = z.infer<typeof createHotelSchema>;
export type UpdateHotelDto = z.infer<typeof updateHotelSchema>;