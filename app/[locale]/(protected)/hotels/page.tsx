import { getTranslations } from 'next-intl/server';
import { HotelsList } from '@/components/Hotels/HotelsList';

export default async function HotelsPage() {
  const t = await getTranslations('Hotels');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('description')}
          </p>
        </div>
        
        <HotelsList />
      </div>
    </div>
  );
}