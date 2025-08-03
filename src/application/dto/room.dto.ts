import { z } from 'zod';

export const createRoomSchema = z.object({
  hotelId: z.string().uuid('ID d\'hôtel invalide'),
  name: z.string().min(1, 'Le nom est requis').max(255),
  description: z.string().optional(),
  capacity: z.number().int().positive('La capacité doit être supérieure à 0'),
  imageUrl: z.union([z.string().url('URL invalide'), z.literal('')]).optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255).optional(),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive('La capacité doit être supérieure à 0').optional(),
  imageUrl: z.union([z.string().url('URL invalide'), z.literal(''), z.null()]).optional(),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;