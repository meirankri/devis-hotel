import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prismaClient";

// GET /api/hotels/[hotelId]/stays - Récupérer les séjours actifs d'un hôtel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    // Vérifier que l'hôtel existe
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, name: true },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hôtel non trouvé" }, { status: 404 });
    }

    // Récupérer les séjours actifs de l'hôtel
    const stays = await prisma.stay.findMany({
      where: {
        hotelId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        startDate: true,
        endDate: true,
        allowPartialBooking: true,
        minDays: true,
        maxDays: true,
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: stays.map((stay) => ({
        id: stay.id,
        name: stay.name,
        slug: stay.slug,
        startDate: stay.startDate.toISOString(),
        endDate: stay.endDate.toISOString(),
        allowPartialBooking: stay.allowPartialBooking,
        minDays: stay.minDays,
        maxDays: stay.maxDays,
      })),
    });
  } catch (error) {
    console.error("Error fetching hotel stays:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des séjours" },
      { status: 500 }
    );
  }
}
