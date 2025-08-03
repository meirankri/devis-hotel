import { notFound } from 'next/navigation';
import { prisma } from '@/lib/database/db';
import { QuoteDetailView } from '@/components/public/QuoteDetailView';

interface QuotePageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params;
  
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      stay: {
        include: {
          hotel: true,
          organization: true,
        },
      },
      quoteParticipants: {
        include: {
          ageRange: true,
        },
      },
      quoteRooms: {
        include: {
          room: {
            include: {
              roomPricings: {
                include: {
                  ageRange: true,
                },
              },
            },
          },
          quoteRoomOccupants: {
            include: {
              ageRange: true,
            },
          },
        },
      },
    },
  });

  if (!quote) {
    notFound();
  }

  // Convertir les Decimals en nombres pour éviter les erreurs de sérialisation
  const serializedQuote = {
    ...quote,
    totalPrice: quote.totalPrice ? Number(quote.totalPrice) : null,
    quoteRooms: quote.quoteRooms.map(qr => ({
      ...qr,
      room: {
        ...qr.room,
        roomPricings: qr.room.roomPricings.map(rp => ({
          ...rp,
          price: Number(rp.price),
        })),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <QuoteDetailView quote={serializedQuote} />
    </div>
  );
}