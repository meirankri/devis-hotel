"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Mail, Phone, Home, Download, Euro, ChevronRight, Info } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { calculateQuotePrice } from "@/utils/priceCalculator";

interface QuoteDetailViewProps {
  quote: any; // TODO: Add proper type
}

export function QuoteDetailView({ quote }: QuoteDetailViewProps) {
  const t = useTranslations("Public.QuoteDetail");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  // Extraire les sous-périodes sélectionnées
  const getSelectedSubPeriods = () => {
    if (!quote.selectedSubPeriods || !quote.stay?.subPeriods) return [];

    try {
      const selectedIds = Array.isArray(quote.selectedSubPeriods)
        ? quote.selectedSubPeriods
        : JSON.parse(quote.selectedSubPeriods);

      if (!Array.isArray(selectedIds)) return [];

      // Mapper les IDs vers les objets complets de sous-périodes
      return selectedIds.map(id => {
        return quote.stay.subPeriods.find((sp: any) => sp.id === id);
      }).filter(Boolean);
    } catch (e) {
      console.error("Error parsing selectedSubPeriods:", e);
      return [];
    }
  };

  const selectedSubPeriods = getSelectedSubPeriods();
  console.log("Selected sub-periods:", selectedSubPeriods);

  // Calculer le prix pour une chambre et un type d'âge
  const getRoomPriceForAgeRange = (room: any, ageRangeId: string, subPeriodId?: string | null) => {
    const pricing = room.roomPricings?.find(
      (rp: any) => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriodId
    );

    // Si pas de prix pour cette sous-période, chercher le prix global
    if (!pricing && subPeriodId) {
      const globalPricing = room.roomPricings?.find(
        (rp: any) => rp.ageRangeId === ageRangeId && !rp.subPeriodId
      );
      return globalPricing?.price ? Number(globalPricing.price) : 0;
    }

    return pricing?.price ? Number(pricing.price) : 0;
  };

  // Créer une ventilation détaillée des prix
  const getPriceBreakdown = () => {
    const breakdown: any[] = [];

    quote.quoteRooms?.forEach((qr: any) => {
      if (!qr.quoteRoomOccupants || qr.quoteRoomOccupants.length === 0) return;

      const roomBreakdown = {
        room: qr.room,
        periods: [] as any[]
      };

      if (selectedSubPeriods.length > 0) {
        // Prix par sous-période
        selectedSubPeriods.forEach((subPeriod: any) => {
          const periodData = {
            period: subPeriod,
            occupants: [] as any[]
          };

          qr.quoteRoomOccupants.forEach((occupant: any) => {
            if (occupant.count > 0) {
              const price = getRoomPriceForAgeRange(qr.room, occupant.ageRangeId, subPeriod.id);
              periodData.occupants.push({
                ageRange: occupant.ageRange,
                count: occupant.count,
                pricePerPerson: price,
                subtotal: price * occupant.count
              });
            }
          });

          roomBreakdown.periods.push(periodData);
        });
      } else {
        // Prix global (pas de sous-périodes)
        const periodData = {
          period: null,
          occupants: [] as any[]
        };

        qr.quoteRoomOccupants.forEach((occupant: any) => {
          if (occupant.count > 0) {
            const price = getRoomPriceForAgeRange(qr.room, occupant.ageRangeId, null);
            periodData.occupants.push({
              ageRange: occupant.ageRange,
              count: occupant.count,
              pricePerPerson: price,
              subtotal: price * occupant.count
            });
          }
        });

        roomBreakdown.periods.push(periodData);
      }

      breakdown.push(roomBreakdown);
    });

    return breakdown;
  };

  const priceBreakdown = getPriceBreakdown();
  const totalPrice = calculateQuotePrice(quote, selectedSubPeriods);

  console.log("Price breakdown:", priceBreakdown);
  console.log("Total price calculated:", totalPrice);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("title")} #{quote.quoteNumber}
            </h1>
            <p className="text-gray-600">
              {t("createdAt")}:{" "}
              {format(new Date(quote.createdAt), "dd MMMM yyyy", {
                locale: dateLocale,
              })}
            </p>
          </div>

          <Button
            onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, "_blank")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("downloadPDF")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${
                quote.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : ""
              }
              ${
                quote.status === "ACCEPTED" ? "bg-green-100 text-green-800" : ""
              }
              ${quote.status === "REJECTED" ? "bg-red-100 text-red-800" : ""}
              ${quote.status === "EXPIRED" ? "bg-gray-100 text-gray-800" : ""}
            `}
            >
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t("clientInfo")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("name")}</p>
              <p className="font-semibold">
                {quote.firstName} {quote.lastName}
              </p>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t("stayInfo")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">{t("stayName")}</p>
            <p className="font-semibold">{quote.stay.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">{t("hotel")}</p>
            <p className="font-semibold">{quote.stay.hotel.name}</p>
            {quote.stay.hotel.address && (
              <p className="text-sm text-gray-500">
                {quote.stay.hotel.address}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("dates")}</p>
              <p className="font-semibold">
                {format(new Date(quote.checkIn), "dd MMM yyyy", {
                  locale: dateLocale,
                })}{" "}
                -
                {format(new Date(quote.checkOut), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Sub-Periods */}
      {selectedSubPeriods.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            <Calendar className="inline h-6 w-6 mr-2" />
            Périodes sélectionnées
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedSubPeriods.map((subPeriod: any) => (
              <div key={subPeriod.id} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{subPeriod.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Du {format(new Date(subPeriod.startDate), "dd MMM", { locale: dateLocale })} au{" "}
                    {format(new Date(subPeriod.endDate), "dd MMM yyyy", { locale: dateLocale })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          <Euro className="inline h-6 w-6 mr-2" />
          Détail des prix
        </h2>

        <div className="space-y-6">
          {priceBreakdown.map((roomData: any, roomIndex: number) => (
            <div key={roomIndex} className="border rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{roomData.room.name}</h3>
                  <p className="text-sm text-gray-600">
                    Capacité: {roomData.room.capacity} personnes
                  </p>
                </div>
                <Home className="h-5 w-5 text-gray-400" />
              </div>

              {roomData.periods.map((periodData: any, periodIndex: number) => (
                <div key={periodIndex} className="mt-4">
                  {periodData.period && (
                    <div className="flex items-center gap-2 mb-3">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">
                        {periodData.period.name}
                      </h4>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left text-sm font-semibold text-gray-700 pb-2">Type d'âge</th>
                          <th className="text-center text-sm font-semibold text-gray-700 pb-2">Nombre</th>
                          <th className="text-right text-sm font-semibold text-gray-700 pb-2">Prix/pers.</th>
                          <th className="text-right text-sm font-semibold text-gray-700 pb-2">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodData.occupants.map((occupant: any, occIndex: number) => (
                          <tr key={occIndex} className="border-b last:border-0">
                            <td className="py-2">
                              <div>
                                <p className="font-medium text-gray-900">{occupant.ageRange.name}</p>
                                {occupant.ageRange.minAge !== null && occupant.ageRange.maxAge !== null && (
                                  <p className="text-xs text-gray-500">
                                    {occupant.ageRange.minAge}-{occupant.ageRange.maxAge} ans
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-2 font-medium">{occupant.count}</td>
                            <td className="text-right py-2 font-medium">{occupant.pricePerPerson}€</td>
                            <td className="text-right py-2 font-bold text-purple-600">{occupant.subtotal}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {selectedSubPeriods.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total pour cette chambre:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {roomData.periods.reduce((roomTotal: number, period: any) =>
                        roomTotal + period.occupants.reduce((periodTotal: number, occ: any) =>
                          periodTotal + occ.subtotal, 0
                        ), 0
                      )}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {priceBreakdown.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune répartition détaillée disponible</p>
          </div>
        )}
      </div>

      {/* Participants Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          <Users className="inline h-6 w-6 mr-2" />
          {t("participants")}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {quote.quoteParticipants.map(
            (participant: any) =>
              participant.count > 0 && (
                <div key={participant.id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {participant.ageRange.name}
                      </p>
                      {participant.ageRange.minAge !== null &&
                        participant.ageRange.maxAge !== null && (
                          <p className="text-sm text-gray-600">
                            {participant.ageRange.minAge}-
                            {participant.ageRange.maxAge} {t("years")}
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {participant.count}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("person", { count: participant.count })}
                      </p>
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      {/* Special Requests */}
      {quote.specialRequests && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t("specialRequests")}
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
            {quote.specialRequests}
          </p>
        </div>
      )}

      {/* Total Price */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("estimatedTotal")}</h2>
            <p className="text-purple-100">{t("priceNote")}</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{totalPrice.toFixed(2)} €</p>
            <p className="text-sm text-purple-100 mt-2">
              {selectedSubPeriods.length > 0 ? `${selectedSubPeriods.length} période(s)` : 'Séjour complet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}