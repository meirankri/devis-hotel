'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users } from 'lucide-react';
import type { Room, StaySubPeriod, AgeRange } from '@/types/quote';
import type { SelectedSubPeriod } from '@/types/multi-step-form';

interface RoomPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  selectedSubPeriods: SelectedSubPeriod[];
  allSubPeriods: StaySubPeriod[];
  ageRanges: AgeRange[];
}

export function RoomPricingModal({
  isOpen,
  onClose,
  room,
  selectedSubPeriods,
  allSubPeriods,
  ageRanges
}: RoomPricingModalProps) {
  // Fonction pour formater une date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Fonction pour obtenir le prix pour une période et un type d'âge
  const getPrice = (subPeriodId: string | null, ageRangeId: string): number | null => {
    const pricing = room.roomPricings.find(
      rp => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriodId
    );

    // Si pas de prix pour cette sous-période, chercher le prix global
    if (!pricing && subPeriodId !== null) {
      const globalPricing = room.roomPricings.find(
        rp => rp.ageRangeId === ageRangeId && rp.subPeriodId === null
      );
      return globalPricing ? globalPricing.price : null;
    }

    return pricing ? pricing.price : null;
  };

  // Organiser les prix par sous-période
  const pricesByPeriod = selectedSubPeriods.length > 0
    ? selectedSubPeriods.map(subPeriod => {
        const fullSubPeriod = allSubPeriods.find(sp => sp.id === subPeriod.id);
        return {
          subPeriod: fullSubPeriod || subPeriod,
          prices: ageRanges.map(ageRange => ({
            ageRange,
            price: getPrice(subPeriod.id, ageRange.id)
          }))
        };
      })
    : [{
        subPeriod: null,
        prices: ageRanges.map(ageRange => ({
          ageRange,
          price: getPrice(null, ageRange.id)
        }))
      }];

  // Calculer le prix total pour les périodes sélectionnées
  const getTotalPriceForAgeRange = (ageRangeId: string): number => {
    if (selectedSubPeriods.length === 0) {
      const price = getPrice(null, ageRangeId);
      return price || 0;
    }

    return selectedSubPeriods.reduce((total, subPeriod) => {
      const price = getPrice(subPeriod.id, ageRangeId);
      return total + (price || 0);
    }, 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{room.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Capacité: {room.capacity} {room.capacity > 1 ? 'personnes' : 'personne'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-180px)]">
              <div className="space-y-6">
                {pricesByPeriod.map((periodData, periodIndex) => (
                  <div
                    key={periodData.subPeriod?.id || 'global'}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    {/* Période header */}
                    {periodData.subPeriod ? (
                      <div className="flex items-center gap-2 mb-4 text-gray-700">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {periodData.subPeriod.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Du {formatDate(periodData.subPeriod.startDate)} au{' '}
                            {formatDate(periodData.subPeriod.endDate)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Prix par personne</h3>
                      </div>
                    )}

                    {/* Prix par type d'âge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {periodData.prices.map(({ ageRange, price }) => {
                        const ageText =
                          ageRange.minAge !== null && ageRange.maxAge !== null
                            ? `${ageRange.minAge}-${ageRange.maxAge} ans`
                            : ageRange.minAge !== null
                            ? `${ageRange.minAge}+ ans`
                            : ageRange.maxAge !== null
                            ? `Jusqu'à ${ageRange.maxAge} ans`
                            : '';

                        return (
                          <div
                            key={ageRange.id}
                            className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{ageRange.name}</p>
                              {ageText && (
                                <p className="text-xs text-gray-500">{ageText}</p>
                              )}
                            </div>
                            <p className={`font-semibold ${price ? 'text-gray-900' : 'text-gray-400'}`}>
                              {price ? `${price}€` : 'Non défini'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Total si plusieurs périodes */}
                {selectedSubPeriods.length > 1 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">Total pour le séjour complet</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ageRanges.map(ageRange => {
                        const total = getTotalPriceForAgeRange(ageRange.id);
                        const ageText =
                          ageRange.minAge !== null && ageRange.maxAge !== null
                            ? `${ageRange.minAge}-${ageRange.maxAge} ans`
                            : '';

                        return (
                          <div
                            key={`total-${ageRange.id}`}
                            className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3 border border-blue-200"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{ageRange.name}</p>
                              {ageText && (
                                <p className="text-xs text-gray-500">{ageText}</p>
                              )}
                            </div>
                            <p className="font-bold text-blue-600 text-lg">
                              {total > 0 ? `${total}€` : 'Non défini'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}