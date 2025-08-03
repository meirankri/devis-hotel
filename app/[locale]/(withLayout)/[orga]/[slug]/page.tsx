import { notFound } from 'next/navigation';
import { StayDetail } from '@/components/public/StayDetail';
import { QuoteFormV2 } from '@/components/public/QuoteFormV2';
import { prisma } from '@/lib/database/db';

interface StayPageProps {
  params: Promise<{
    slug: string;
    locale: string;
    orga: string;
  }>;
}

export default async function StayPage({ params }: StayPageProps) {
  const { slug, orga } = await params;
  
  // D'abord, trouvons l'organisation
  const organization = await prisma.organization.findUnique({
    where: { slug: orga },
  });

  if (!organization) {
    notFound();
  }

  const stay = await prisma.stay.findFirst({
    where: { 
      slug,
      organizationId: organization.id
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

  // Convertir les Decimals en nombres pour éviter les erreurs de sérialisation
  const serializedStay = {
    ...stay,
    hotel: {
      ...stay.hotel,
      rooms: stay.hotel.rooms.map(room => ({
        ...room,
        roomPricings: room.roomPricings.map(rp => ({
          ...rp,
          price: Number(rp.price),
        })),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StayDetail stay={serializedStay} />
      <QuoteFormV2 stay={serializedStay} />
    </div>
  );
}