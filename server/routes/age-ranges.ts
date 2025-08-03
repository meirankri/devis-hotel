import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '@/server/trpc';
import { createAgeRangeSchema, updateAgeRangeSchema } from '@/application/dto/age-range.dto';
import { PrismaAgeRangeRepository } from '@/infrastructure/repositories/PrismaAgeRangeRepository';
import { prisma } from '@/lib/database/db';
import { AgeRange } from '@/domain/entities/AgeRange';

const ageRangeRepository = new PrismaAgeRangeRepository(prisma);

export const ageRangesRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ageRangeRepository.findAllByOrganization(ctx.organizationId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const ageRange = await ageRangeRepository.findById(input.id, ctx.organizationId);
      
      if (!ageRange) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tranche d\'âge non trouvée',
        });
      }
      
      return ageRange;
    }),

  create: protectedProcedure
    .input(createAgeRangeSchema)
    .mutation(async ({ input, ctx }) => {
      const ageRangeData = AgeRange.create(input);
      return await ageRangeRepository.save(ageRangeData, ctx.organizationId);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateAgeRangeSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const ageRange = await ageRangeRepository.findById(input.id, ctx.organizationId);
      if (!ageRange) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tranche d\'âge non trouvée',
        });
      }

      try {
        ageRange.update(input.data);
        return await ageRangeRepository.update(input.id, input.data, ctx.organizationId);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const ageRange = await ageRangeRepository.findById(input.id, ctx.organizationId);
      if (!ageRange) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tranche d\'âge non trouvée',
        });
      }

      await ageRangeRepository.delete(input.id, ctx.organizationId);
      return { success: true };
    }),
});