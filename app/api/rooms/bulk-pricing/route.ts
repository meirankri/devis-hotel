import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prismaClient';
import { z } from 'zod';
import { validateSession } from '@/lib/lucia';
import { Decimal } from '@prisma/client/runtime/library';

// Schema de validation pour définir des prix en masse
const bulkPricingSchema = z.object({
  roomIds: z.array(z.string().uuid()).min(1),
  ageRangeId: z.string().uuid(),
  subPeriodId: z.string().uuid().nullable().optional(),
  price: z.number().min(0),
});

// POST /api/rooms/bulk-pricing - Définir le même prix pour plusieurs chambres
export async function POST(
  request: NextRequest
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validatedData = bulkPricingSchema.parse(body);

    // Vérifier que toutes les chambres existent et appartiennent à la même organisation
    const rooms = await prisma.room.findMany({
      where: {
        id: { in: validatedData.roomIds }
      },
      select: {
        id: true,
        hotel: {
          select: {
            id: true,
            organizationId: true
          }
        }
      }
    });

    if (rooms.length !== validatedData.roomIds.length) {
      return NextResponse.json(
        { error: 'Une ou plusieurs chambres non trouvées' },
        { status: 404 }
      );
    }

    // Vérifier que toutes les chambres appartiennent au même hôtel
    const hotelIds = [...new Set(rooms.map((r) => r.hotel.id))];
    if (hotelIds.length > 1) {
      return NextResponse.json(
        { error: 'Les chambres doivent appartenir au même hôtel' },
        { status: 400 }
      );
    }

    const organizationId = rooms[0].hotel.organizationId;

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true }
    });

    if (organizationId && userWithOrg?.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que la tranche d'âge existe et appartient à l'organisation
    const ageRange = await prisma.ageRange.findUnique({
      where: { id: validatedData.ageRangeId },
      select: { organizationId: true }
    });

    if (!ageRange || (organizationId && ageRange.organizationId !== organizationId)) {
      return NextResponse.json(
        { error: 'Tranche d\'âge non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

    // Si une sous-période est fournie, vérifier qu'elle existe et appartient à un séjour de l'hôtel
    if (validatedData.subPeriodId) {
      const subPeriod = await prisma.staySubPeriod.findUnique({
        where: { id: validatedData.subPeriodId },
        include: {
          stay: {
            select: {
              hotelId: true
            }
          }
        }
      });

      if (!subPeriod || subPeriod.stay.hotelId !== hotelIds[0]) {
        return NextResponse.json(
          { error: 'Sous-période non trouvée ou n\'appartient pas à cet hôtel' },
          { status: 404 }
        );
      }
    }

    // Créer ou mettre à jour les prix pour toutes les chambres dans une transaction
    const operations = await Promise.all(validatedData.roomIds.map(async (roomId) => {
      if (validatedData.subPeriodId) {
        // Si subPeriodId est fourni, utiliser upsert avec la contrainte unique
        return prisma.roomPricing.upsert({
          where: {
            roomId_ageRangeId_subPeriodId: {
              roomId,
              ageRangeId: validatedData.ageRangeId,
              subPeriodId: validatedData.subPeriodId
            }
          },
          create: {
            roomId,
            ageRangeId: validatedData.ageRangeId,
            subPeriodId: validatedData.subPeriodId,
            price: new Decimal(validatedData.price),
          },
          update: {
            price: new Decimal(validatedData.price),
          }
        });
      } else {
        // Pour subPeriodId null, rechercher d'abord puis create ou update
        const existing = await prisma.roomPricing.findFirst({
          where: {
            roomId,
            ageRangeId: validatedData.ageRangeId,
            subPeriodId: null
          }
        });

        if (existing) {
          return prisma.roomPricing.update({
            where: { id: existing.id },
            data: { price: new Decimal(validatedData.price) }
          });
        } else {
          return prisma.roomPricing.create({
            data: {
              roomId,
              ageRangeId: validatedData.ageRangeId,
              subPeriodId: null,
              price: new Decimal(validatedData.price),
            }
          });
        }
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        updated: operations.length,
        price: validatedData.price,
        rooms: validatedData.roomIds,
        ageRangeId: validatedData.ageRangeId,
        subPeriodId: validatedData.subPeriodId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error setting bulk pricing:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la définition des tarifs' },
      { status: 500 }
    );
  }
}