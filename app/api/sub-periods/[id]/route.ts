import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prismaClient";
import { z } from "zod";
import { validateSession } from "@/lib/lucia";

// Schema de validation pour la modification d'une sous-période
const updateSubPeriodSchema = z.object({
  name: z.string().min(1, "Le nom est requis").optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  order: z.number().int().min(0).optional(),
});

// GET /api/sub-periods/[id] - Récupérer une sous-période
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subPeriod = await prisma.staySubPeriod.findUnique({
      where: { id },
      include: {
        stay: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: { roomPricings: true },
        },
      },
    });

    if (!subPeriod) {
      return NextResponse.json(
        { error: "Sous-période non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...subPeriod,
        hasPricing: subPeriod._count.roomPricings > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching sub-period:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la sous-période" },
      { status: 500 }
    );
  }
}

// PUT /api/sub-periods/[id] - Modifier une sous-période
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Valider les données
    const validatedData = updateSubPeriodSchema.parse(body);

    // Récupérer la sous-période avec les infos du séjour
    const subPeriod = await prisma.staySubPeriod.findUnique({
      where: { id },
      include: {
        stay: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            organizationId: true,
          },
        },
      },
    });

    if (!subPeriod) {
      return NextResponse.json(
        { error: "Sous-période non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (
      subPeriod.stay.organizationId &&
      userWithOrg?.organizationId !== subPeriod.stay.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Si les dates sont modifiées, vérifier les contraintes
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = validatedData.startDate
        ? new Date(validatedData.startDate)
        : subPeriod.startDate;
      const endDate = validatedData.endDate
        ? new Date(validatedData.endDate)
        : subPeriod.endDate;

      // Valider que les dates sont dans les limites du séjour
      if (
        startDate < subPeriod.stay.startDate ||
        endDate > subPeriod.stay.endDate
      ) {
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

      // Vérifier les chevauchements avec les autres sous-périodes (sauf celle qu'on modifie)
      const otherPeriods = await prisma.staySubPeriod.findMany({
        where: {
          stayId: subPeriod.stay.id,
          id: { not: id },
        },
      });

      const hasOverlap = otherPeriods.some((period) => {
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
          { error: "Cette sous-période chevauche avec une autre sous-période" },
          { status: 400 }
        );
      }

      if (validatedData.startDate) updateData.startDate = startDate;
      if (validatedData.endDate) updateData.endDate = endDate;
    }

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.order !== undefined)
      updateData.order = validatedData.order;

    // Mettre à jour la sous-période
    const updatedSubPeriod = await prisma.staySubPeriod.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedSubPeriod,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating sub-period:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la sous-période" },
      { status: 500 }
    );
  }
}

// DELETE /api/sub-periods/[id] - Supprimer une sous-période
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const { user } = await validateSession();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer la sous-période avec les infos du séjour
    const subPeriod = await prisma.staySubPeriod.findUnique({
      where: { id },
      include: {
        stay: {
          select: {
            id: true,
            organizationId: true,
          },
        },
        _count: {
          select: { roomPricings: true },
        },
      },
    });

    if (!subPeriod) {
      return NextResponse.json(
        { error: "Sous-période non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true },
    });

    if (
      subPeriod.stay.organizationId &&
      userWithOrg?.organizationId !== subPeriod.stay.organizationId
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier si des devis utilisent cette sous-période
    const quotesWithSubPeriod = await prisma.quote.findMany({
      where: {
        stayId: subPeriod.stay.id,
        // Note: Vous devrez adapter cette requête selon votre schéma Prisma
        // Si selectedSubPeriods est un champ JSON, utilisez une autre approche
      },
      select: { id: true },
    });

    if (quotesWithSubPeriod.length > 0) {
      return NextResponse.json(
        {
          error: `Cette sous-période est utilisée dans ${quotesWithSubPeriod.length} devis. Suppression impossible.`,
          quotesCount: quotesWithSubPeriod.length,
        },
        { status: 400 }
      );
    }

    // Supprimer la sous-période et ses prix associés dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer d'abord tous les prix liés à cette sous-période
      await tx.roomPricing.deleteMany({
        where: { subPeriodId: id },
      });

      // Ensuite supprimer la sous-période
      await tx.staySubPeriod.delete({
        where: { id },
      });

      // Réorganiser les ordres des sous-périodes restantes
      const remainingPeriods = await tx.staySubPeriod.findMany({
        where: { stayId: subPeriod.stay.id },
        orderBy: [{ order: "asc" }, { startDate: "asc" }],
      });

      // Mettre à jour les ordres pour qu'ils soient séquentiels
      for (let index = 0; index < remainingPeriods.length; index++) {
        await tx.staySubPeriod.update({
          where: { id: remainingPeriods[index].id },
          data: { order: index },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Sous-période et ses tarifs supprimés avec succès",
    });
  } catch (error) {
    console.error("Error deleting sub-period:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la sous-période" },
      { status: 500 }
    );
  }
}
