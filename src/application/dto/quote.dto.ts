import { z } from 'zod';

export const createQuoteRequestSchema = z.object({
  stayId: z.string().uuid('ID de séjour invalide'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  participants: z.array(z.object({
    ageRangeId: z.string().uuid(),
    count: z.number().int().min(0),
  })).min(1),
  rooms: z.array(z.object({
    roomId: z.string().uuid(),
    quantity: z.number().int().min(1),
    occupants: z.array(z.object({
      ageRangeId: z.string().uuid(),
      count: z.number().int().min(0),
    })).optional(),
  })).optional(),
  specialRequests: z.string().optional(),
}).refine(
  data => {
    const hasParticipants = data.participants.some(p => p.count > 0);
    return hasParticipants;
  },
  {
    message: "Au moins un participant est requis",
    path: ['participants'],
  }
).refine(
  data => {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    return checkIn < checkOut;
  },
  {
    message: "La date d'arrivée doit être avant la date de départ",
    path: ['checkIn'],
  }
);

export type CreateQuoteRequestDto = z.infer<typeof createQuoteRequestSchema>;