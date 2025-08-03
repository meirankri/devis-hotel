'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Users, Euro, Mail, Phone, CheckCircle, XCircle, Clock, MapPin, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { generateQuotePdf } from '@/lib/pdf/generateQuotePdf';

interface QuoteDetailProps {
  quote: any;
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
  const t = useTranslations('Quotes');
  const locale = useLocale();
  const dateLocale = locale === 'fr' ? fr : enUS;
  const router = useRouter();
  const [totalPrice, setTotalPrice] = useState(quote.totalPrice?.toNumber() || 0);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateStatus = trpc.quotes.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: t('statusUpdateSuccess'),
        description: t('statusUpdateSuccessDesc'),
      });
      router.refresh();
    },
    onError: () => {
      toast({
        title: t('statusUpdateError'),
        description: t('statusUpdateErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const handleStatusUpdate = async (status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') => {
    await updateStatus.mutateAsync({ id: quote.id, status });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: t('statusPending') },
      ACCEPTED: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: t('statusAccepted') },
      REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: t('statusRejected') },
      EXPIRED: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: t('statusExpired') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium', config.color)}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const calculatePrice = () => {
    setIsCalculating(true);
    
    // Calculer le nombre de nuits
    const checkIn = new Date(quote.checkIn);
    const checkOut = new Date(quote.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculer le prix total basé sur les participants et les tarifs
    let total = 0;
    
    quote.quoteParticipants.forEach((participant: any) => {
      // Trouver le prix moyen pour cette tranche d'âge
      const prices = quote.stay.hotel.rooms
        .flatMap((room: any) => room.roomPricings)
        .filter((rp: any) => rp.ageRangeId === participant.ageRangeId)
        .map((rp: any) => Number(rp.price));
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
        total += avgPrice * participant.count * nights;
      }
    });
    
    setTotalPrice(Math.round(total * 100) / 100);
    setIsCalculating(false);
    
    toast({
      title: t('priceCalculated'),
      description: t('priceCalculatedDesc', { price: total.toFixed(2) }),
    });
  };

  const handleGeneratePdf = () => {
    try {
      // Préparer les données pour le PDF
      const roomPrices = quote.stay.hotel.rooms
        .flatMap((room: any) => room.roomPricings)
        .map((rp: any) => ({
          ageRangeId: rp.ageRangeId,
          roomId: rp.roomId,
          price: Number(rp.price)
        }));

      console.log('Quote data:', quote);
      console.log('Room prices:', roomPrices);
      console.log('Quote participants:', quote.quoteParticipants);

      const quoteData = {
        quote: {
          id: quote.id,
          firstName: quote.firstName,
          lastName: quote.lastName,
          email: quote.email,
          phone: quote.phone,
          checkInDate: quote.checkIn,
          checkOutDate: quote.checkOut,
          status: quote.status,
          createdAt: quote.createdAt,
          stay: {
            name: quote.stay.name,
            hotel: {
              name: quote.stay.hotel.name,
              address: quote.stay.hotel.address
            }
          },
          quoteParticipants: quote.quoteParticipants.map((p: any) => ({
            count: p.count,
            ageRange: {
              id: p.ageRange.id,
              name: p.ageRange.name,
              minAge: p.ageRange.minAge,
              maxAge: p.ageRange.maxAge
            }
          }))
        },
        roomPrices
      };

      const pdfBlob = generateQuotePdf(quoteData);
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-${quote.id.slice(0, 8)}-${quote.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF généré',
        description: 'Le devis a été téléchargé avec succès',
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive',
      });
    }
  };

  const totalParticipants = quote.quoteParticipants.reduce((sum: number, p: any) => sum + p.count, 0);
  const nights = Math.ceil((new Date(quote.checkOut).getTime() - new Date(quote.checkIn).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Informations principales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {quote.firstName} {quote.lastName}
          </h2>
          {getStatusBadge(quote.status)}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{t('email')}</p>
                <p className="font-medium">{quote.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{t('phone')}</p>
                <p className="font-medium">{quote.phone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{t('dates')}</p>
                <p className="font-medium">
                  {format(new Date(quote.checkIn), 'dd MMMM', { locale: dateLocale })} - {format(new Date(quote.checkOut), 'dd MMMM yyyy', { locale: dateLocale })}
                </p>
                <p className="text-sm text-gray-500">{nights} {t('nights')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{t('stay')}</p>
                <p className="font-medium">{quote.stay.name}</p>
                <p className="text-sm text-gray-500">{quote.stay.hotel.name}</p>
              </div>
            </div>
          </div>
        </div>

        {quote.specialRequests && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">{t('specialRequests')}</p>
            <p className="text-sm text-gray-600">{quote.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('participants')} ({totalParticipants})
        </h3>
        
        <div className="space-y-3">
          {quote.quoteParticipants.map((participant: any) => (
            <div key={participant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{participant.ageRange.name}</p>
                {participant.ageRange.minAge !== null && participant.ageRange.maxAge !== null && (
                  <p className="text-sm text-gray-600">
                    {participant.ageRange.minAge}-{participant.ageRange.maxAge} {t('years')}
                  </p>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {participant.count} {participant.count === 1 ? t('person') : t('persons')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tarification */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="h-5 w-5" />
          {t('pricing')}
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="totalPrice">{t('totalPrice')}</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="totalPrice"
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="pl-10"
                  step="0.01"
                  min="0"
                />
              </div>
              <Button
                onClick={calculatePrice}
                variant="outline"
                disabled={isCalculating}
              >
                {isCalculating ? t('calculating') : t('calculate')}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('priceHint')}</p>
          </div>

          {totalPrice > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {t('pricePerNight')}: {(totalPrice / nights / totalParticipants).toFixed(2)}€
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {quote.status === 'PENDING' && (
          <>
            <Button
              onClick={() => handleStatusUpdate('ACCEPTED')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('acceptQuote')}
            </Button>
            <Button
              onClick={() => handleStatusUpdate('REJECTED')}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t('rejectQuote')}
            </Button>
          </>
        )}
        
        {quote.status === 'ACCEPTED' && (
          <Button
            onClick={() => handleStatusUpdate('EXPIRED')}
            variant="outline"
          >
            <Clock className="mr-2 h-4 w-4" />
            {t('markAsExpired')}
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => window.print()}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('print')}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleGeneratePdf}
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}