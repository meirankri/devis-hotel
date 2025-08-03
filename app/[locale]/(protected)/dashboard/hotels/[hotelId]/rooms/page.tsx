import { getTranslations } from "next-intl/server";
import { RoomsList } from "@/components/Rooms/RoomsList";
import { db } from "@/lib/database/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Hotel } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

interface RoomsPageProps {
  params: Promise<{
    hotelId: string;
    locale: string;
  }>;
}

export default async function RoomsPage({ params }: RoomsPageProps) {
  const { hotelId } = await params;
  const t = await getTranslations("Rooms");

  const hotel = await db.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Container className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/hotels"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("backToHotels")}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Hotel className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              <p className="text-gray-600 mt-1">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        <RoomsList hotelId={hotelId} hotelName={hotel.name} />
      </Container>
    </div>
  );
}
