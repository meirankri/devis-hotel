"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Users, Mail, Phone, Home, Download } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface QuoteDetailViewProps {
  quote: any; // TODO: Add proper type
}

export function QuoteDetailView({ quote }: QuoteDetailViewProps) {
  const t = useTranslations("Public.QuoteDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  const calculateTotalPrice = () => {
    let total = 0;

    // Si nous avons des occupants par chambre, utiliser ce calcul
    if (quote.quoteRooms && quote.quoteRooms.length > 0) {
      quote.quoteRooms.forEach((qr: any) => {
        if (qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0) {
          // Calculer pour chaque occupant de la chambre
          qr.quoteRoomOccupants.forEach((occupant: any) => {
            const pricing = qr.room.roomPricings.find(
              (rp: any) => rp.ageRangeId === occupant.ageRangeId
            );
            if (pricing && occupant.count > 0) {
              // Le prix est pour tout le séjour
              total += pricing.price * occupant.count;
            }
          });
        }
      });
    } else {
      // Ancien calcul basé sur les participants (pour compatibilité)
      const nights = Math.ceil(
        (new Date(quote.checkOut).getTime() - new Date(quote.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      
      quote.quoteParticipants.forEach((participant: any) => {
        if (participant.count > 0 && quote.quoteRooms.length > 0) {
          const roomPrices: number[] = [];
          
          quote.quoteRooms.forEach((qr: any) => {
            const pricing = qr.room.roomPricings.find(
              (rp: any) => rp.ageRangeId === participant.ageRangeId
            );
            if (pricing) {
              roomPrices.push(Number(pricing.price));
            }
          });

          if (roomPrices.length > 0) {
            const avgPrice = roomPrices.reduce((sum, price) => sum + price, 0) / roomPrices.length;
            total += avgPrice * participant.count;
          }
        }
      });
    }

    return total;
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("title")} #{quote.quoteNumber}
            </h1>
            <p className="text-gray-600">
              {t("createdAt")}: {format(new Date(quote.createdAt), "dd MMMM yyyy", { locale: dateLocale })}
            </p>
          </div>
          
          <Button
            onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("downloadPDF")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${quote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : ''}
              ${quote.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
              ${quote.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {t(`status.${quote.status}`)}
            </span>
          </div>
          
          {quote.stay.organization && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{t("organization")}</p>
              <p className="font-semibold">{quote.stay.organization.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("clientInfo")}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("name")}</p>
              <p className="font-semibold">{quote.firstName} {quote.lastName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("email")}</p>
              <p className="font-semibold">{quote.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("phone")}</p>
              <p className="font-semibold">{quote.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stay Information */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("stayInfo")}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">{t("stayName")}</p>
            <p className="font-semibold">{quote.stay.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">{t("hotel")}</p>
            <p className="font-semibold">{quote.stay.hotel.name}</p>
            {quote.stay.hotel.address && (
              <p className="text-sm text-gray-500">{quote.stay.hotel.address}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("dates")}</p>
              <p className="font-semibold">
                {format(new Date(quote.checkIn), "dd MMM yyyy", { locale: dateLocale })} - 
                {format(new Date(quote.checkOut), "dd MMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms */}
      {quote.quoteRooms.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <Home className="inline h-6 w-6 mr-2" />
            {t("rooms")}
          </h2>
          
          <div className="space-y-4">
            {quote.quoteRooms.map((qr: any, index: number) => (
              <div key={qr.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-3">
                  <p className="font-semibold text-lg">{qr.room.name}</p>
                  <p className="text-sm text-gray-600">
                    {t("capacity")}: {qr.room.capacity} {t("persons")}
                  </p>
                </div>
                
                {qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">{t("occupants")}:</p>
                    {qr.quoteRoomOccupants.map((occupant: any) => (
                      occupant.count > 0 && (
                        <div key={occupant.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{occupant.ageRange.name}</span>
                          <span className="font-medium">{occupant.count} {t("person", { count: occupant.count })}</span>
                        </div>
                      )
                    ))}
                    <div className="pt-2 border-t text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t("totalOccupants")}:</span>
                        <span className="font-semibold">
                          {qr.quoteRoomOccupants.reduce((sum: number, o: any) => sum + o.count, 0)} {t("persons")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          <Users className="inline h-6 w-6 mr-2" />
          {t("participants")}
        </h2>
        
        <div className="space-y-4">
          {quote.quoteParticipants.map((participant: any) => (
            participant.count > 0 && (
              <div key={participant.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{participant.ageRange.name}</p>
                    {participant.ageRange.minAge !== null && participant.ageRange.maxAge !== null && (
                      <p className="text-sm text-gray-600">
                        {participant.ageRange.minAge}-{participant.ageRange.maxAge} {t("years")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{participant.count} {t("person", { count: participant.count })}</p>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Special Requests */}
      {quote.specialRequests && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("specialRequests")}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{quote.specialRequests}</p>
        </div>
      )}

      {/* Total Price */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t("estimatedTotal")}</h2>
            <p className="text-blue-100">{t("priceNote")}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{totalPrice.toFixed(2)} €</p>
          </div>
        </div>
      </div>
    </div>
  );
}