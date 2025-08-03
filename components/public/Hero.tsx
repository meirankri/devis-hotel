'use client';

import { useTranslations } from 'next-intl';
import { Calendar, Hotel, Users } from 'lucide-react';

export function Hero() {
  const t = useTranslations('Public.Hero');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            {t('subtitle')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Hotel className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('feature1Title')}</h3>
              <p className="text-gray-600">{t('feature1Desc')}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('feature2Title')}</h3>
              <p className="text-gray-600">{t('feature2Desc')}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('feature3Title')}</h3>
              <p className="text-gray-600">{t('feature3Desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}