import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prismaClient';
import { z } from 'zod';
import { validateSession } from '@/lib/lucia';

// Schema de validation pour la réorganisation
const reorderSchema = z.object({
  subPeriodIds: z.array(z.string().uuid()).min(1),
});

// POST /api/stays/[stayId]/sub-periods/reorder - Réorganiser les sous-périodes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stayId: string }> }
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

    const { stayId } = await params;
    const body = await request.json();

    // Valider les données
    const validatedData = reorderSchema.parse(body);

    // Vérifier que le séjour existe et appartient à l'organisation de l'utilisateur
    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
      select: {
        id: true,
        organizationId: true,
        subPeriods: {
          select: { id: true }
        }
      }
    });

    if (!stay) {
      return NextResponse.json(
        { error: 'Séjour non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur appartient à la même organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: { organizationId: true }
    });

    if (stay.organizationId && userWithOrg?.organizationId !== stay.organizationId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que tous les IDs fournis correspondent aux sous-périodes du séjour
    const existingIds = stay.subPeriods.map((sp) => sp.id);
    const providedIds = new Set(validatedData.subPeriodIds);

    // Vérifier qu'on a le bon nombre d'IDs
    if (providedIds.size !== existingIds.length) {
      return NextResponse.json(
        { error: 'Le nombre de sous-périodes ne correspond pas' },
        { status: 400 }
      );
    }

    // Vérifier que tous les IDs fournis existent
    for (const id of validatedData.subPeriodIds) {
      if (!existingIds.includes(id)) {
        return NextResponse.json(
          { error: `Sous-période ${id} non trouvée pour ce séjour` },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'ordre de chaque sous-période dans une transaction
    const updates = validatedData.subPeriodIds.map((id, index) =>
      prisma.staySubPeriod.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    // Récupérer les sous-périodes réordonnées
    const reorderedPeriods = await prisma.staySubPeriod.findMany({
      where: { stayId },
      orderBy: [{ order: 'asc' }, { startDate: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: reorderedPeriods
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reordering sub-periods:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réorganisation des sous-périodes' },
      { status: 500 }
    );
  }
}