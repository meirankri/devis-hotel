import { getTranslations } from 'next-intl/server';
import { AgeRangesList } from '@/components/AgeRanges/AgeRangesList';
import { Users } from 'lucide-react';
import { Container } from '@/components/ui/container';

export default async function AgeRangesPage() {
  const t = await getTranslations('AgeRanges');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Container className="max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('description')}
            </p>
          </div>
        </div>
        
        <AgeRangesList />
      </Container>
    </div>
  );
}