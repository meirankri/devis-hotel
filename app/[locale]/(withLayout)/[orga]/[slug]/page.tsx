import { notFound } from "next/navigation";
import { StayDetailLuxury } from "@/components/public/StayDetailLuxury";
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
      subPeriods: true,
      images: {
        orderBy: [{ isMain: "desc" }, { order: "asc" }],
      },
    },
  });

  if (!stay || !stay.isActive || !stay.organization) {
    notFound();
  }

  const serializedStay = {
    ...stay,
    organizationId: stay.organizationId || organization.id, // Ensure organizationId is not null
    startDate: stay.startDate.toISOString(),
    endDate: stay.endDate.toISOString(),
    createdAt: stay.createdAt.toISOString(),
    updatedAt: stay.updatedAt.toISOString(),
    hotel: {
      ...stay.hotel,
      createdAt: stay.hotel.createdAt.toISOString(),
      updatedAt: stay.hotel.updatedAt.toISOString(),
      rooms: stay.hotel.rooms.map((room) => ({
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
        roomPricings: room.roomPricings.map((rp) => ({
          ...rp,
          price: Number(rp.price),
          createdAt: rp.createdAt.toISOString(),
          updatedAt: rp.updatedAt.toISOString(),
          ageRange: {
            ...rp.ageRange,
            createdAt: rp.ageRange.createdAt.toISOString(),
            updatedAt: rp.ageRange.updatedAt.toISOString(),
          },
        })),
      })),
    },
    organization: {
      ...stay.organization,
      createdAt: stay.organization.createdAt.toISOString(),
      updatedAt: stay.organization.updatedAt.toISOString(),
    },
    images: stay.images.map((image) => ({
      ...image,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
    })),
    subPeriods: stay.subPeriods?.map((sp) => ({
      ...sp,
      startDate: sp.startDate.toISOString(),
      endDate: sp.endDate.toISOString(),
      createdAt: sp.createdAt.toISOString(),
      updatedAt: sp.updatedAt.toISOString(),
    })),
  };

  console.log("serializedStay", serializedStay);

  return (
    <div className="min-h-screen bg-white">
      <StayDetailLuxury stay={serializedStay} />
      <QuoteFormV2 stay={serializedStay} />
    </div>
  );
}
