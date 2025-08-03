import { getTranslations } from 'next-intl/server';
import { QuoteDetail } from '@/components/Quotes/QuoteDetail';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/database/db';

interface QuoteDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations('Quotes');
  
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      stay: {
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
      },
      quoteParticipants: {
        include: {
          ageRange: true,
        },
      },
    },
  });

  if (!quote) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/quotes" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToQuotes')}</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('quoteDetails')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('quoteNumber')}: {quote.quoteNumber}
              </p>
            </div>
          </div>
        </div>
        
        <QuoteDetail quote={quote} />
      </div>
    </div>
  );
}