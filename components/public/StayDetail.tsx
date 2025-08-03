'use client';

import { useTranslations } from 'next-intl';
import { Calendar, MapPin, Users, Check } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface StayDetailProps {
  stay: any;
}

export function StayDetail({ stay }: StayDetailProps) {
  const t = useTranslations('Public.StayDetail');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? fr : enUS;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {stay.name}
            </h1>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-lg text-gray-600">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>{stay.hotel.name}</span>
              </div>
              
              <div className="flex items-center gap-3 text-lg text-gray-600">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>
                  {format(new Date(stay.startDate), 'dd MMMM', { locale: dateLocale })} - {format(new Date(stay.endDate), 'dd MMMM yyyy', { locale: dateLocale })}
                </span>
              </div>
              
              {stay.allowPartialBooking && (
                <div className="flex items-center gap-3 text-lg text-gray-600">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>{t('partialBooking')}</span>
                  {stay.minDays && <span className="text-sm">({t('min')} {stay.minDays} {t('days')})</span>}
                  {stay.maxDays && <span className="text-sm">({t('max')} {stay.maxDays} {t('days')})</span>}
                </div>
              )}
            </div>

            {stay.description && (
              <div 
                className="prose prose-lg max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: stay.description }}
              />
            )}
          </div>

          <div className="relative h-96 lg:h-full rounded-2xl overflow-hidden shadow-2xl">
            {stay.imageUrl ? (
              <Image
                src={stay.imageUrl}
                alt={stay.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Calendar className="h-24 w-24 text-blue-600/30" />
              </div>
            )}
          </div>
        </div>

        {/* Caractéristiques de l'hôtel */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">{t('hotelFeatures')}</h2>
          
          {stay.hotel.description && (
            <div 
              className="prose prose-lg max-w-none text-gray-600 mb-8"
              dangerouslySetInnerHTML={{ __html: stay.hotel.description }}
            />
          )}

          {stay.hotel.address && (
            <div className="flex items-center gap-3 text-lg text-gray-600">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>{stay.hotel.address}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}