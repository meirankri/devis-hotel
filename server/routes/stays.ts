import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { createStaySchema, updateStaySchema } from "@/application/dto/stay.dto";
import { prisma } from "@/lib/database/db";
import { Stay } from "@/domain/entities/Stay";
import { logger } from "@/utils/logger";

export const staysRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const stays = await prisma.stay.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        hotel: true,
        organization: true,
        images: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return stays;
  }),

  getActiveStays: publicProcedure.query(async () => {
    const stays = await prisma.stay.findMany({
      where: { isActive: true },
      include: {
        hotel: true,
        organization: true,
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy: { startDate: "asc" },
    });
    return stays;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const stay = await prisma.stay.findFirst({
        where: {
          id: String(input.id),
          organizationId: ctx.organizationId,
        },
        include: {
          hotel: true,
          organization: true,
          images: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!stay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Séjour non trouvé",
        });
      }

      return stay;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const stay = await prisma.stay.findFirst({
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
          images: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!stay || !stay.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Séjour non trouvé",
        });
      }

      return stay;
    }),

  create: protectedProcedure
    .input(createStaySchema)
    .mutation(async ({ input, ctx }) => {
      // Vérifier que le slug est unique au sein de l'organisation
      const existingStay = await prisma.stay.findFirst({
        where: {
          slug: input.slug,
          organizationId: ctx.organizationId,
        },
      });

      if (existingStay) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Un séjour avec ce slug existe déjà",
        });
      }

      // Utiliser l'organisation de l'utilisateur connecté
      const organizationId = ctx.organizationId;

      // Vérifier que l'hôtel appartient à l'organisation
      const hotel = await prisma.hotel.findFirst({
        where: {
          id: input.hotelId,
          organizationId: ctx.organizationId,
        },
      });

      if (!hotel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hôtel non trouvé ou accès refusé",
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
          organizationId: organizationId,
          allowPartialBooking: stayData.allowPartialBooking,
          minDays: stayData.minDays,
          maxDays: stayData.maxDays,
          isActive: stayData.isActive,
          imageUrl:
            stayData.imageUrl ||
            (input.images && input.images.length > 0
              ? input.images.find((img) => img.isMain)?.url ||
                input.images[0].url
              : undefined),
          images:
            input.images && input.images.length > 0
              ? {
                  create: input.images.map((img, index) => ({
                    url: img.url,
                    order: img.order ?? index,
                    isMain: img.isMain ?? index === 0,
                  })),
                }
              : undefined,
        },
        include: {
          images: true,
        },
      });

      return stay;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateStaySchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const stayData = input.data as z.infer<typeof updateStaySchema>;
      const existingStay = await prisma.stay.findFirst({
        where: {
          id: String(input.id),
          organizationId: ctx.organizationId,
        },
      });

      if (!existingStay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Séjour non trouvé",
        });
      }

      // Vérifier l'unicité du slug si modifié
      if (stayData.slug && stayData.slug !== existingStay.slug) {
        const stayWithSlug = await prisma.stay.findFirst({
          where: {
            slug: stayData.slug,
            organizationId: ctx.organizationId,
          },
        });

        if (stayWithSlug) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un séjour avec ce slug existe déjà",
          });
        }
      }

      const updateData: any = { ...stayData };
      if (stayData.startDate)
        updateData.startDate = new Date(stayData.startDate);
      if (stayData.endDate) updateData.endDate = new Date(stayData.endDate);
      if (stayData.slug)
        updateData.slug = stayData.slug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");

      // Gérer les images
      if (stayData.images !== undefined) {
        // Récupérer les anciennes images pour les supprimer du stockage
        const oldImages = await prisma.stayImage.findMany({
          where: { stayId: String(input.id) },
        });

        // Supprimer les anciennes images du stockage Cloudflare R2
        if (oldImages.length > 0) {
          const { CloudflareStorageService } = await import(
            "@/lib/storage/CloudflareStorageService"
          );
          const storageService = new CloudflareStorageService();

          for (const oldImage of oldImages) {
            // Vérifier si l'image n'est pas dans les nouvelles images (pour éviter de supprimer une image qu'on garde)
            const isKept = stayData.images.some(
              (newImg) => newImg.url === oldImage.url
            );
            if (!isKept) {
              try {
                const urlParts = oldImage.url.split("/");
                const fileName = urlParts.slice(-3).join("/");
                await storageService.deleteFile(fileName);
              } catch (error) {
                logger({
                  message: `Erreur lors de la suppression de l'image ${oldImage.url}:`,
                  context: error,
                }).error();
              }
            }
          }
        }

        // Supprimer les anciennes images de la base
        await prisma.stayImage.deleteMany({
          where: { stayId: String(input.id) },
        });

        // Ajouter les nouvelles images
        if (stayData.images.length > 0) {
          await prisma.stayImage.createMany({
            data: stayData.images.map((img, index) => ({
              stayId: String(input.id),
              url: img.url,
              order: img.order ?? index,
              isMain: img.isMain ?? index === 0,
            })),
          });

          // Mettre à jour imageUrl avec l'image principale ou la première image
          const mainImage =
            stayData.images.find((img) => img.isMain) || stayData.images[0];
          updateData.imageUrl = mainImage.url;
        } else {
          updateData.imageUrl = null;
        }
      }

      // Retirer images de updateData car ce n'est pas un champ direct
      delete updateData.images;

      const stay = await prisma.stay.update({
        where: { id: String(input.id) },
        data: updateData,
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      });

      return stay;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const stay = await prisma.stay.findFirst({
        where: {
          id: String(input.id),
          organizationId: ctx.organizationId,
        },
        include: {
          images: true,
        },
      });

      if (!stay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Séjour non trouvé",
        });
      }

      // Supprimer les images du stockage Cloudflare R2
      if (stay.images && stay.images.length > 0) {
        const { CloudflareStorageService } = await import(
          "@/lib/storage/CloudflareStorageService"
        );
        const storageService = new CloudflareStorageService();

        for (const image of stay.images) {
          try {
            // Extraire le chemin du fichier de l'URL
            const urlParts = image.url.split("/");
            const fileName = urlParts.slice(-3).join("/"); // entityType/entityId/filename
            await storageService.deleteFile(fileName);
          } catch (error) {
            logger({
              message: `Erreur lors de la suppression de l'image ${image.url}:`,
              context: error,
            }).error();
            // On continue même si une suppression échoue
          }
        }
      }

      // Supprimer aussi l'image principale si elle existe et n'est pas dans les images
      if (
        stay.imageUrl &&
        !stay.images.some((img) => img.url === stay.imageUrl)
      ) {
        try {
          const { CloudflareStorageService } = await import(
            "@/lib/storage/CloudflareStorageService"
          );
          const storageService = new CloudflareStorageService();
          const urlParts = stay.imageUrl.split("/");
          const fileName = urlParts.slice(-3).join("/");
          await storageService.deleteFile(fileName);
        } catch (error) {
          logger({
            message: `Erreur lors de la suppression de l'image principale:`,
            context: error,
          }).error();
        }
      }

      await prisma.stay.delete({
        where: { id: String(input.id) },
      });

      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const stay = await prisma.stay.findFirst({
        where: {
          id: String(input.id),
          organizationId: ctx.organizationId,
        },
      });

      if (!stay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Séjour non trouvé",
        });
      }

      const updated = await prisma.stay.update({
        where: { id: String(input.id) },
        data: { isActive: !stay.isActive },
      });

      return updated;
    }),
});
