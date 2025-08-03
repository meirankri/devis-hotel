import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '@/server/trpc';
import { createHotelSchema, updateHotelSchema } from '@/application/dto/hotel.dto';
import { CreateHotelUseCase } from '@/application/use-cases/hotel/CreateHotelUseCase';
import { UpdateHotelUseCase } from '@/application/use-cases/hotel/UpdateHotelUseCase';
import { GetHotelsUseCase } from '@/application/use-cases/hotel/GetHotelsUseCase';
import { DeleteHotelUseCase } from '@/application/use-cases/hotel/DeleteHotelUseCase';
import { PrismaHotelRepository } from '@/infrastructure/repositories/PrismaHotelRepository';
import { prisma } from '@/lib/database/db';

const hotelRepository = new PrismaHotelRepository(prisma);

export const hotelsRouter = router({
  getAll: protectedProcedure.query(async () => {
    const getHotelsUseCase = new GetHotelsUseCase(hotelRepository);
    return await getHotelsUseCase.execute();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const getHotelsUseCase = new GetHotelsUseCase(hotelRepository);
      const hotel = await getHotelsUseCase.getById(input.id);
      
      if (!hotel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hôtel non trouvé',
        });
      }
      
      return hotel;
    }),

  create: protectedProcedure
    .input(createHotelSchema)
    .mutation(async ({ input }) => {
      const createHotelUseCase = new CreateHotelUseCase(hotelRepository);
      return await createHotelUseCase.execute(input);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateHotelSchema,
    }))
    .mutation(async ({ input }) => {
      const updateHotelUseCase = new UpdateHotelUseCase(hotelRepository);
      
      try {
        return await updateHotelUseCase.execute(input.id, input.data);
      } catch (error) {
        if (error instanceof Error && error.message === 'Hôtel non trouvé') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleteHotelUseCase = new DeleteHotelUseCase(hotelRepository);
      
      try {
        await deleteHotelUseCase.execute(input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message === 'Hôtel non trouvé') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw error;
      }
    }),
});