import { getTranslations } from 'next-intl/server';
import { StaysList } from '@/components/Stays/StaysList';
import { Calendar } from 'lucide-react';
import { Container } from '@/components/ui/container';

export default async function StaysPage() {
  const t = await getTranslations('Stays');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Container className="max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('description')}
            </p>
          </div>
        </div>
        
        <StaysList />
      </Container>
    </div>
  );
}