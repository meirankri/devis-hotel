import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '@/server/trpc';
import { createStaySchema, updateStaySchema } from '@/application/dto/stay.dto';
import { prisma } from '@/lib/database/db';
import { Stay } from '@/domain/entities/Stay';

export const staysRouter = router({
  getAll: protectedProcedure.query(async () => {
    const stays = await prisma.stay.findMany({
      include: {
        hotel: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return stays;
  }),

  getActiveStays: publicProcedure.query(async () => {
    const stays = await prisma.stay.findMany({
      where: { isActive: true },
      include: {
        hotel: true,
      },
      orderBy: { startDate: 'asc' },
    });
    return stays;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const stay = await prisma.stay.findUnique({
        where: { id: String(input.id) },
        include: {
          hotel: true,
        },
      });

      if (!stay) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non trouvé',
        });
      }

      return stay;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const stay = await prisma.stay.findUnique({
        where: { slug: input.slug },
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
      });

      if (!stay || !stay.isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non trouvé',
        });
      }

      return stay;
    }),

  create: protectedProcedure
    .input(createStaySchema)
    .mutation(async ({ input }) => {
      // Vérifier que le slug est unique
      const existingStay = await prisma.stay.findUnique({
        where: { slug: input.slug },
      });

      if (existingStay) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Un séjour avec ce slug existe déjà',
        });
      }

      const stayData = Stay.create({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      const stay = await prisma.stay.create({
        data: {
          name: stayData.name,
          slug: stayData.slug,
          description: stayData.description,
          startDate: stayData.startDate,
          endDate: stayData.endDate,
          hotelId: stayData.hotelId,
          allowPartialBooking: stayData.allowPartialBooking,
          minDays: stayData.minDays,
          maxDays: stayData.maxDays,
          isActive: stayData.isActive,
          imageUrl: stayData.imageUrl,
        },
      });

      return stay;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateStaySchema,
    }))
    .mutation(async ({ input }) => {
      const stayData = input.data as z.infer<typeof updateStaySchema>;
      const existingStay = await prisma.stay.findUnique({
        where: { id: String(input.id) },
      });

      if (!existingStay) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non trouvé',
        });
      }

      // Vérifier l'unicité du slug si modifié
      if (stayData.slug && stayData.slug !== existingStay.slug) {
        const stayWithSlug = await prisma.stay.findUnique({
          where: { slug: stayData.slug },
        });

        if (stayWithSlug) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Un séjour avec ce slug existe déjà',
          });
        }
      }

      const updateData: any = { ...stayData };
      if (stayData.startDate) updateData.startDate = new Date(stayData.startDate);
      if (stayData.endDate) updateData.endDate = new Date(stayData.endDate);
      if (stayData.slug) updateData.slug = stayData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      const stay = await prisma.stay.update({
        where: { id: String(input.id) },
        data: updateData,
      });

      return stay;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const stay = await prisma.stay.findUnique({
        where: { id: String(input.id) },
      });

      if (!stay) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non trouvé',
        });
      }

      await prisma.stay.delete({
        where: { id: String(input.id) },
      });

      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const stay = await prisma.stay.findUnique({
        where: { id: String(input.id) },
      });

      if (!stay) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Séjour non trouvé',
        });
      }

      const updated = await prisma.stay.update({
        where: { id: String(input.id) },
        data: { isActive: !stay.isActive },
      });

      return updated;
    }),
});