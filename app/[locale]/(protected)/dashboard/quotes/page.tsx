import { getTranslations } from 'next-intl/server';
import { QuotesList } from '@/components/Quotes/QuotesList';
import { FileText } from 'lucide-react';
import { Container } from '@/components/ui/container';

export default async function QuotesPage() {
  const t = await getTranslations('Quotes');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Container className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('description')}
              </p>
            </div>
          </div>
        </div>
        
        <QuotesList />
      </Container>
    </div>
  );
}