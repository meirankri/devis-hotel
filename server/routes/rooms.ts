import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '@/server/trpc';
import { createRoomSchema, updateRoomSchema } from '@/application/dto/room.dto';
import { PrismaRoomRepository } from '@/infrastructure/repositories/PrismaRoomRepository';
import { PrismaRoomPricingRepository } from '@/infrastructure/repositories/PrismaRoomPricingRepository';
import { PrismaAgeRangeRepository } from '@/infrastructure/repositories/PrismaAgeRangeRepository';
import { prisma } from '@/lib/database/db';
import { Room } from '@/domain/entities/Room';
import { RoomPricing } from '@/domain/entities/RoomPricing';
import { Decimal } from '@prisma/client/runtime/library';

const roomRepository = new PrismaRoomRepository(prisma);
const roomPricingRepository = new PrismaRoomPricingRepository(prisma);
const ageRangeRepository = new PrismaAgeRangeRepository(prisma);

export const roomsRouter = router({
  getByHotelId: protectedProcedure
    .input(z.object({ hotelId: z.string().uuid() }))
    .query(async ({ input }) => {
      const rooms = await prisma.room.findMany({
        where: { hotelId: input.hotelId },
        include: {
          roomPricings: {
            include: {
              ageRange: true,
            },
            orderBy: {
              ageRange: {
                order: 'asc',
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return rooms;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.id },
        include: {
          roomPricings: {
            include: {
              ageRange: true,
            },
          },
        },
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chambre non trouvée',
        });
      }

      return room;
    }),

  create: protectedProcedure
    .input(createRoomSchema)
    .mutation(async ({ input }) => {
      const roomData = Room.create(input);
      const room = await roomRepository.save(roomData);
      
      // Créer les prix par défaut pour toutes les tranches d'âge
      const ageRanges = await ageRangeRepository.findAll();
      for (const ageRange of ageRanges) {
        const roomPricingData = RoomPricing.create({
          roomId: room.id,
          ageRangeId: ageRange.id,
          price: 0,
        });
        await roomPricingRepository.save(roomPricingData);
      }
      
      return room;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateRoomSchema,
    }))
    .mutation(async ({ input }) => {
      const room = await roomRepository.findById(input.id);
      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chambre non trouvée',
        });
      }

      room.update(input.data);
      return await roomRepository.update(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const room = await roomRepository.findById(input.id);
      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chambre non trouvée',
        });
      }

      await roomRepository.delete(input.id);
      return { success: true };
    }),

  updatePricing: protectedProcedure
    .input(z.object({
      roomId: z.string().uuid(),
      ageRangeId: z.string().uuid(),
      price: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      await prisma.roomPricing.upsert({
        where: {
          roomId_ageRangeId: {
            roomId: input.roomId,
            ageRangeId: input.ageRangeId,
          },
        },
        update: {
          price: new Decimal(input.price),
        },
        create: {
          roomId: input.roomId,
          ageRangeId: input.ageRangeId,
          price: new Decimal(input.price),
        },
      });

      return { success: true };
    }),

  updateMultiplePricing: protectedProcedure
    .input(z.object({
      roomIds: z.array(z.string().uuid()),
      ageRangeId: z.string().uuid(),
      price: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      await roomPricingRepository.updateMultipleRooms(
        input.roomIds,
        input.ageRangeId,
        input.price
      );

      return { success: true };
    }),
});