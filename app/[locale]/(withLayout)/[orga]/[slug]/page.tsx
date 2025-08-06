import { notFound } from "next/navigation";
import { StayDetail } from "@/components/public/StayDetail";
import { QuoteFormV2 } from "@/components/public/QuoteFormV2";
import { prisma } from "@/lib/database/db";

interface StayPageProps {
  params: Promise<{
    slug: string;
    locale: string;
    orga: string;
  }>;
}

export default async function StayPage({ params }: StayPageProps) {
  const { slug, orga } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug: orga },
  });

  if (!organization) {
    notFound();
  }

  const stay = await prisma.stay.findFirst({
    where: {
      slug,
      organizationId: organization.id,
    },
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
      organization: true,
    },
  });

  if (!stay || !stay.isActive) {
    notFound();
  }

  const serializedStay = {
    ...stay,
    hotel: {
      ...stay.hotel,
      rooms: stay.hotel.rooms.map((room) => ({
        ...room,
        roomPricings: room.roomPricings.map((rp) => ({
          ...rp,
          price: Number(rp.price),
        })),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      <StayDetail stay={serializedStay} />
      <QuoteFormV2 stay={serializedStay} />
    </div>
  );
}
