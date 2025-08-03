import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '@/server/trpc';
import { createQuoteRequestSchema } from '@/application/dto/quote.dto';
import { prisma } from '@/lib/database/db';
import { randomUUID } from 'crypto';

export const quotesRouter = router({
  getAll: protectedProcedure.query(async () => {
    const quotes = await prisma.quote.findMany({
      include: {
        stay: {
          include: {
            hotel: true,
          },
        },
        quoteParticipants: {
          include: {
            ageRange: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
        include: {
          stay: {
            include: {
              hotel: {
                include: {
                  rooms: {
                    include: {
                      roomPricings: {
                        include: {
                          ageRange: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          quoteParticipants: {
            include: {
              ageRange: true,
            },
          },
        },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Devis non trouvé',
        });
      }

      return quote;
    }),

  createPublic: publicProcedure
    .input(createQuoteRequestSchema)
    .mutation(async ({ input }) => {
      // Vérifier que le séjour existe et est actif
      const stay = await prisma.stay.findUnique({
        where: { id: input.stayId },
      });

      if (!stay || !stay.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non disponible',
        });
      }

      // Vérifier les dates
      const checkIn = new Date(input.checkIn);
      const checkOut = new Date(input.checkOut);
      
      if (checkIn < stay.startDate || checkOut > stay.endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Les dates sélectionnées sont en dehors de la période du séjour',
        });
      }

      // Si réservation partielle
      if (stay.allowPartialBooking) {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        if (stay.minDays && nights < stay.minDays) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Minimum ${stay.minDays} nuits requises`,
          });
        }
        
        if (stay.maxDays && nights > stay.maxDays) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Maximum ${stay.maxDays} nuits autorisées`,
          });
        }
      }

      // Créer le devis
      const quoteNumber = `DEV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      const quote = await prisma.quote.create({
        data: {
          quoteNumber,
          stayId: input.stayId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          checkIn,
          checkOut,
          specialRequests: input.specialRequests,
          status: 'PENDING',
          quoteParticipants: {
            create: input.participants
              .filter(p => p.count > 0)
              .map(p => ({
                ageRangeId: p.ageRangeId,
                count: p.count,
              })),
          },
        },
        include: {
          stay: {
            include: {
              hotel: true,
            },
          },
          quoteParticipants: {
            include: {
              ageRange: true,
            },
          },
        },
      });

      // TODO: Envoyer un email de confirmation

      return quote;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
    }))
    .mutation(async ({ input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Devis non trouvé',
        });
      }

      return await prisma.quote.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const quote = await prisma.quote.findUnique({
        where: { id: input.id },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Devis non trouvé',
        });
      }

      await prisma.quote.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});