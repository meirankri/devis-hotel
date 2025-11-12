import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prismaClient";
import { z } from "zod";
import { validateSession } from "@/lib/lucia";

// Schema de validation pour la création d'une sous-période
const createSubPeriodSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  order: z.number().int().min(0).optional(),
});

// GET /api/stays/[stayId]/sub-periods - Lister les sous-périodes d'un séjour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> }
) {
  try {
    const { stayId } = await params;

    // Vérifier que le séjour existe
    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
    });

    if (!stay) {
      return NextResponse.json({ error: "Séjour non trouvé" }, { status: 404 });
    }

    // Récupérer les sous-périodes avec indication si des prix sont définis
    const subPeriods = await prisma.staySubPeriod.findMany({
      where: { stayId },
      orderBy: [{ order: "asc" }, { startDate: "asc" }],
      include: {
        _count: {
          select: { roomPricings: true },
        },
      },
    });

    // Formater les données pour inclure un indicateur de prix
    const formattedSubPeriods = subPeriods.map((period) => ({
      id: period.id,
      name: period.name,
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
      order: period.order,
      hasPricing: period._count.roomPricings > 0,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedSubPeriods,
    });
  } catch (error) {
    console.error("Error fetching sub-periods:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sous-périodes" },
      { status: 500 }
    );
  }
}

// POST /api/stays/[stayId]/sub-periods - Créer une sous-période
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> }
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { stayId } = await params;
    const body = await request.json();

    // Valider les données
    const validatedData = createSubPeriodSchema.parse(body);

    // Vérifier que le séjour existe et appartient à l'organisation de l'utilisateur
    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        organizationId: true,
      },
    });

    if (!stay) {
      return NextResponse.json({ error: "Séjour non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (
      stay.organizationId &&
      userWithOrg?.organizationId !== stay.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Valider que les dates sont dans les limites du séjour
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate < stay.startDate || endDate > stay.endDate) {
      return NextResponse.json(
        { error: "Les dates doivent être dans les limites du séjour" },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 }
      );
    }

    // Vérifier les chevauchements avec les autres sous-périodes
    const existingPeriods = await prisma.staySubPeriod.findMany({
      where: { stayId },
    });

    const hasOverlap = existingPeriods.some((period) => {
      const existingStart = period.startDate;
      const existingEnd = period.endDate;

      return (
        (startDate >= existingStart && startDate < existingEnd) ||
        (endDate > existingStart && endDate <= existingEnd) ||
        (startDate <= existingStart && endDate >= existingEnd)
      );
    });

    if (hasOverlap) {
      return NextResponse.json(
        {
          error: "Cette sous-période chevauche avec une sous-période existante",
        },
        { status: 400 }
      );
    }

    // Déterminer l'ordre si non fourni
    const order = validatedData.order ?? existingPeriods.length;

    // Créer la sous-période
    const subPeriod = await prisma.staySubPeriod.create({
      data: {
        stayId,
        name: validatedData.name,
        startDate,
        endDate,
        order,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: subPeriod,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating sub-period:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la sous-période" },
      { status: 500 }
    );
  }
}
