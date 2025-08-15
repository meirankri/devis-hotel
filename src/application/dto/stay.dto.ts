import { z } from 'zod';

const stayImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url('URL invalide'),
  order: z.number().int().min(0).default(0),
  isMain: z.boolean().default(false),
});

const baseStaySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  slug: z.string().min(1, 'Le slug est requis').max(255)
    .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  hotelId: z.string().uuid('ID d\'hôtel invalide'),
  organizationId: z.string().uuid('ID d\'organisation invalide').optional(),
  allowPartialBooking: z.boolean().default(false),
  minDays: z.number().int().positive().optional(),
  maxDays: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  imageUrl: z.union([z.string().url('URL invalide'), z.literal('')]).optional(),
  images: z.array(stayImageSchema).max(10, 'Maximum 10 images autorisées').optional(),
});

export const createStaySchema = baseStaySchema.refine(
  data => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  },
  {
    message: "La date de début doit être avant la date de fin",
    path: ['startDate'],
  }
).refine(
  data => {
    if (data.minDays && data.maxDays) {
      return data.minDays <= data.maxDays;
    }
    return true;
  },
  {
    message: "Le nombre minimum de jours ne peut pas être supérieur au maximum",
    path: ['minDays'],
  }
);

export const updateStaySchema = baseStaySchema.partial().refine(
  data => {
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    }
    return true;
  },
  {
    message: "La date de début doit être avant la date de fin",
    path: ['startDate'],
  }
).refine(
  data => {
    if (data.minDays && data.maxDays) {
      return data.minDays <= data.maxDays;
    }
    return true;
  },
  {
    message: "Le nombre minimum de jours ne peut pas être supérieur au maximum",
    path: ['minDays'],
  }
);

export type StayImageDto = z.infer<typeof stayImageSchema>;
export type CreateStayDto = z.infer<typeof createStaySchema>;
export type UpdateStayDto = z.infer<typeof updateStaySchema>;