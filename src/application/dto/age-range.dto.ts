import { z } from 'zod';

export const createAgeRangeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  minAge: z.number().int().min(0, 'L\'âge minimum doit être positif').optional(),
  maxAge: z.number().int().min(0, 'L\'âge maximum doit être positif').optional(),
  order: z.number().int().min(0).default(0),
}).refine(
  data => {
    if (data.minAge !== undefined && data.maxAge !== undefined) {
      return data.minAge <= data.maxAge;
    }
    return true;
  },
  {
    message: "L'âge minimum ne peut pas être supérieur à l'âge maximum",
    path: ['minAge'],
  }
);

export const updateAgeRangeSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255).optional(),
  minAge: z.number().int().min(0, 'L\'âge minimum doit être positif').nullable().optional(),
  maxAge: z.number().int().min(0, 'L\'âge maximum doit être positif').nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateAgeRangeDto = z.infer<typeof createAgeRangeSchema>;
export type UpdateAgeRangeDto = z.infer<typeof updateAgeRangeSchema>;