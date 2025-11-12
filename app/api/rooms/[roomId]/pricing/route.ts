import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prismaClient";
import { z } from "zod";
import { validateSession } from "@/lib/lucia";
import { Decimal } from "@prisma/client/runtime/library";

// Schema de validation pour définir un prix
const setPricingSchema = z.object({
  ageRangeId: z.string().uuid(),
  subPeriodId: z.string().uuid().nullable().optional(),
  price: z.number().min(0),
});

// GET /api/rooms/[roomId]/pricing - Récupérer tous les prix d'une chambre
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Vérifier l'authentification pour obtenir l'organisation de l'utilisateur
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { roomId } = await params;

    // Vérifier que la chambre existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          include: {
            stays: {
              where: { isActive: true },
              include: {
                subPeriods: {
                  orderBy: [{ order: "asc" }, { startDate: "asc" }],
                },
              },
            },
          },
        },
        roomPricings: {
          include: {
            ageRange: true,
            subPeriod: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    // Récupérer les tranches d'âge de l'organisation de l'utilisateur
    // (cohérent avec RoomsList qui utilise trpc.ageRanges.getAll())
    const ageRanges = await prisma.ageRange.findMany({
      where: {
        organizationId: userWithOrg?.organizationId || undefined,
      },
      orderBy: { order: "asc" },
    });

    // Formater les données de prix par sous-période
    const pricingBySubPeriod: Record<string, Record<string, number>> = {};

    // Prix global (sans sous-période)
    pricingBySubPeriod["global"] = {};

    // Initialiser avec les sous-périodes existantes
    room.hotel.stays.forEach((stay) => {
      stay.subPeriods.forEach((subPeriod) => {
        pricingBySubPeriod[subPeriod.id] = {};
      });
    });

    // Remplir avec les prix existants
    room.roomPricings.forEach((pricing) => {
      const key = pricing.subPeriodId || "global";
      pricingBySubPeriod[key] = pricingBySubPeriod[key] || {};
      pricingBySubPeriod[key][pricing.ageRangeId] = Number(pricing.price);
    });

    return NextResponse.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
        },
        ageRanges,
        stays: room.hotel.stays.map((stay) => ({
          id: stay.id,
          name: stay.name,
          subPeriods: stay.subPeriods,
        })),
        pricing: pricingBySubPeriod,
      },
    });
  } catch (error) {
    console.error("Error fetching room pricing:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tarifs" },
      { status: 500 }
    );
  }
}

// POST /api/rooms/[roomId]/pricing - Définir un prix pour une chambre
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();

    // Valider les données
    const validatedData = setPricingSchema.parse(body);

    // Vérifier que la chambre existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        hotel: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (
      room.hotel.organizationId &&
      userWithOrg?.organizationId !== room.hotel.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que la tranche d'âge existe et appartient à l'organisation de l'utilisateur
    const ageRange = await prisma.ageRange.findUnique({
      where: { id: validatedData.ageRangeId },
      select: { organizationId: true },
    });

    if (
      !ageRange ||
      (userWithOrg?.organizationId &&
        ageRange.organizationId !== userWithOrg.organizationId)
    ) {
      return NextResponse.json(
        { error: "Tranche d'âge non trouvée ou non autorisée" },
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
              hotelId: true,
            },
          },
        },
      });

      if (!subPeriod || subPeriod.stay.hotelId !== room.hotel.id) {
        return NextResponse.json(
          { error: "Sous-période non trouvée ou n'appartient pas à cet hôtel" },
          { status: 404 }
        );
      }
    }

    // Créer ou mettre à jour le prix
    // Si subPeriodId est fourni, utiliser upsert avec la contrainte unique
    // Sinon, faire un findFirst puis create ou update
    let pricing;
    if (validatedData.subPeriodId) {
      pricing = await prisma.roomPricing.upsert({
        where: {
          roomId_ageRangeId_subPeriodId: {
            roomId,
            ageRangeId: validatedData.ageRangeId,
            subPeriodId: validatedData.subPeriodId,
          },
        },
        create: {
          roomId,
          ageRangeId: validatedData.ageRangeId,
          subPeriodId: validatedData.subPeriodId,
          price: new Decimal(validatedData.price),
        },
        update: {
          price: new Decimal(validatedData.price),
        },
        include: {
          ageRange: true,
          subPeriod: true,
        },
      });
    } else {
      // Pour subPeriodId null, rechercher d'abord
      const existing = await prisma.roomPricing.findFirst({
        where: {
          roomId,
          ageRangeId: validatedData.ageRangeId,
          subPeriodId: null,
        },
      });

      if (existing) {
        pricing = await prisma.roomPricing.update({
          where: { id: existing.id },
          data: {
            price: new Decimal(validatedData.price),
          },
          include: {
            ageRange: true,
            subPeriod: true,
          },
        });
      } else {
        pricing = await prisma.roomPricing.create({
          data: {
            roomId,
            ageRangeId: validatedData.ageRangeId,
            subPeriodId: null,
            price: new Decimal(validatedData.price),
          },
          include: {
            ageRange: true,
            subPeriod: true,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error setting room pricing:", error);
    return NextResponse.json(
      { error: "Erreur lors de la définition du tarif" },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[roomId]/pricing - Supprimer un prix
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const ageRangeId = searchParams.get("ageRangeId");
    const subPeriodId = searchParams.get("subPeriodId");

    if (!ageRangeId) {
      return NextResponse.json(
        { error: "ageRangeId est requis" },
        { status: 400 }
      );
    }

    // Vérifier que la chambre existe et que l'utilisateur y a accès
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        hotel: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Chambre non trouvée" },
        { status: 404 }
      );
    }

    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (
      room.hotel.organizationId &&
      userWithOrg?.organizationId !== room.hotel.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer le prix
    // Si subPeriodId est fourni, utiliser la contrainte unique
    // Sinon, rechercher et supprimer
    if (subPeriodId) {
      await prisma.roomPricing.delete({
        where: {
          roomId_ageRangeId_subPeriodId: {
            roomId,
            ageRangeId,
            subPeriodId,
          },
        },
      });
    } else {
      const pricing = await prisma.roomPricing.findFirst({
        where: {
          roomId,
          ageRangeId,
          subPeriodId: null,
        },
      });

      if (pricing) {
        await prisma.roomPricing.delete({
          where: { id: pricing.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tarif supprimé avec succès",
    });
  } catch (error) {
    console.error("Error deleting room pricing:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du tarif" },
      { status: 500 }
    );
  }
}
