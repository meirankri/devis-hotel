import { getTranslations } from 'next-intl/server';
import { ActiveStays } from '@/components/public/ActiveStays';
import { Hero } from '@/components/public/Hero';

export default async function HomePage() {
  const t = await getTranslations('Public');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Hero />
      <ActiveStays />
    </div>
  );
}