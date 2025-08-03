import { notFound } from 'next/navigation';
import { StayDetail } from '@/components/public/StayDetail';
import { QuoteForm } from '@/components/public/QuoteForm';
import { prisma } from '@/lib/database/db';

interface StayPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function StayPage({ params }: StayPageProps) {
  const { slug } = await params;
  
  const stay = await prisma.stay.findUnique({
    where: { slug },
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
    },
  });

  if (!stay || !stay.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StayDetail stay={stay} />
      <QuoteForm stay={stay} />
    </div>
  );
}