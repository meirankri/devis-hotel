'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

export function ActiveStays() {
  const t = useTranslations('Public.Stays');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? fr : enUS;
  
  const { data: stays, isLoading } = trpc.stays.getActiveStays.useQuery();

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!stays || stays.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {stays.map((stay: any) => (
            <div key={stay.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                {stay.imageUrl ? (
                  <Image
                    src={stay.imageUrl}
                    alt={stay.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-blue-600/30" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {stay.name}
                </h3>
                
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{stay.hotel.name}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(stay.startDate), 'dd MMM', { locale: dateLocale })} - {format(new Date(stay.endDate), 'dd MMM yyyy', { locale: dateLocale })}
                  </span>
                </div>
                
                {stay.description && (
                  <div 
                    className="text-gray-600 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: stay.description }}
                  />
                )}
                
                {stay.allowPartialBooking && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
                    <Users className="h-4 w-4" />
                    <span>{t('partialBookingAvailable')}</span>
                  </div>
                )}
                
                <Link href={`/${stay.organization?.slug || 'default'}/${stay.slug}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {t('requestQuote')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}