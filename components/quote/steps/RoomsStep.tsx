"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Plus, Minus, Users, Euro, AlertCircle, ChevronLeft, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { RoomPricingModal } from '../RoomPricingModal';
import type { Room, StaySubPeriod, AgeRange } from '@/types/quote';
import type { SelectedRoom, SelectedSubPeriod } from '@/types/multi-step-form';
import { ROOM_CAPACITY_SAFETY_FACTOR } from '@/constants/form.constants';

interface RoomsStepProps {
  rooms: Room[];
  selectedRooms: SelectedRoom[];
  totalParticipants: number;
  totalCapacity: number;
  onUpdateRoomQuantity: (room: Room, quantity: number) => void;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
  selectedSubPeriods?: SelectedSubPeriod[];
  allSubPeriods?: StaySubPeriod[];
  ageRanges?: AgeRange[];
}

export const RoomsStep: React.FC<RoomsStepProps> = ({
  rooms,
  selectedRooms,
  totalParticipants,
  totalCapacity,
  onUpdateRoomQuantity,
  canContinue,
  onContinue,
  onBack,
  selectedSubPeriods = [],
  allSubPeriods = [],
  ageRanges = []
}) => {
  const t = useTranslations('Public.QuoteForm');
  const [modalRoom, setModalRoom] = useState<Room | null>(null);

  const getRoomQuantity = (roomId: string): number => {
    return selectedRooms.find(sr => sr.roomId === roomId)?.quantity || 0;
  };

  const canAddMoreRooms = (room: Room): boolean => {
    // Calculer la capacité actuelle totale sélectionnée
    const currentTotalCapacity = selectedRooms.reduce((sum, sr) => 
      sum + (sr.room.capacity * sr.quantity), 0
    );
    
    // Si on ajoute une chambre de plus, quelle serait la nouvelle capacité ?
    const newPotentialCapacity = currentTotalCapacity + room.capacity;
    
    // On peut ajouter une chambre si la nouvelle capacité ne dépasse pas trop le nombre de participants
    // On permet de la flexibilité avec le facteur de sécurité défini (par défaut 50% de plus)
    return newPotentialCapacity <= Math.max(totalParticipants * ROOM_CAPACITY_SAFETY_FACTOR, totalParticipants + 3);
  };


  const getRoomPriceDetails = (room: Room) => {
    // Si on a des sous-périodes, on vérifie s'il y a des prix variables
    if (selectedSubPeriods.length > 0) {
      const hasDifferentPrices = ageRanges.some(ageRange => {
        const prices = selectedSubPeriods.map(sp => {
          const pricing = room.roomPricings.find(
            rp => rp.ageRangeId === ageRange.id && rp.subPeriodId === sp.id
          );
          // Si pas de prix pour cette sous-période, chercher le prix global
          if (!pricing) {
            const globalPricing = room.roomPricings.find(
              rp => rp.ageRangeId === ageRange.id && rp.subPeriodId === null
            );
            return globalPricing?.price || 0;
          }
          return pricing.price;
        });
        // Vérifier si tous les prix sont identiques
        return new Set(prices).size > 1;
      });

      if (hasDifferentPrices) {
        return { hasVariablePrices: true, prices: [] };
      }
    }

    // Sinon, on retourne les prix uniques par tranche d'âge
    const uniquePrices = new Map<string, { name: string, price: number, ageRangeId: string }>();

    room.roomPricings
      .filter(rp => rp.price > 0)
      .forEach(rp => {
        // Si on a des sous-périodes sélectionnées, on ne prend que les prix correspondants
        if (selectedSubPeriods.length > 0) {
          if (rp.subPeriodId && selectedSubPeriods.some(sp => sp.id === rp.subPeriodId)) {
            if (!uniquePrices.has(rp.ageRangeId)) {
              uniquePrices.set(rp.ageRangeId, {
                name: rp.ageRange.name,
                price: rp.price,
                ageRangeId: rp.ageRangeId
              });
            }
          } else if (!rp.subPeriodId && !uniquePrices.has(rp.ageRangeId)) {
            // Prix global si pas de prix spécifique pour la sous-période
            uniquePrices.set(rp.ageRangeId, {
              name: rp.ageRange.name,
              price: rp.price,
              ageRangeId: rp.ageRangeId
            });
          }
        } else {
          // Pas de sous-périodes, on prend les prix globaux
          if (!rp.subPeriodId && !uniquePrices.has(rp.ageRangeId)) {
            uniquePrices.set(rp.ageRangeId, {
              name: rp.ageRange.name,
              price: rp.price,
              ageRangeId: rp.ageRangeId
            });
          }
        }
      });

    const prices = Array.from(uniquePrices.values())
      .sort((a, b) => {
        const orderA = room.roomPricings.find(rp => rp.ageRangeId === a.ageRangeId)?.ageRange.order || 0;
        const orderB = room.roomPricings.find(rp => rp.ageRangeId === b.ageRangeId)?.ageRange.order || 0;
        return orderA - orderB;
      });

    return { hasVariablePrices: false, prices };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Home className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{t('roomSelection')}</h3>
            <p className="text-gray-600 mt-1">
              Sélectionnez les chambres pour vos {totalParticipants} participants
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Modifier les participants
        </Button>
      </div>

      {/* Room selection grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {rooms.map((room) => {
          const quantity = getRoomQuantity(room.id);
          const priceDetails = getRoomPriceDetails(room);
          const canAdd = canAddMoreRooms(room);
          
          return (
            <div
              key={room.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all ${
                quantity > 0 
                  ? 'border-blue-500 ring-2 ring-blue-100' 
                  : !canAdd
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Room image */}
              {room.imageUrl && (
                <div className="relative h-48 rounded-t-2xl overflow-hidden">
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                  {quantity > 0 && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {quantity} sélectionnée{quantity > 1 ? 's' : ''}
                    </div>
                  )}
                  {!canAdd && quantity === 0 && (
                    <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                      Capacité atteinte
                    </div>
                  )}
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Room info */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{room.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      {room.capacity} {room.capacity === 1 ? 'personne' : 'personnes'}
                    </span>
                  </div>
                </div>

                {/* Price details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-medium text-gray-700">Prix par personne (séjour complet)</p>
                  </div>

                  <div className="space-y-2">
                    {priceDetails.hasVariablePrices ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Prix variables selon les périodes</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setModalRoom(room)}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Info className="h-4 w-4" />
                          Voir le détail des prix
                        </Button>
                      </div>
                    ) : priceDetails.prices.length > 0 ? (
                      <>
                        {priceDetails.prices.map((pd, index) => (
                          <div key={`${pd.ageRangeId}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <span className="text-sm font-medium text-gray-700">{pd.name}</span>
                            <span className="text-base font-bold text-gray-900">{pd.price}€</span>
                          </div>
                        ))}
                        {selectedSubPeriods.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setModalRoom(room)}
                            className="w-full text-xs text-gray-500 hover:text-gray-700"
                          >
                            Voir le détail par période
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Prix non configurés</p>
                    )}
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Nombre de chambres</span>
                    <p className="text-xs text-gray-500">Combien de cette chambre voulez-vous réserver ?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onUpdateRoomQuantity(room, Math.max(0, quantity - 1))}
                      disabled={quantity === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <div className="w-12 text-center">
                      <span className="text-xl font-bold text-gray-900">{quantity}</span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => onUpdateRoomQuantity(room, quantity + 1)}
                      disabled={!canAdd}
                      title={!canAdd ? "Capacité maximale atteinte" : "Ajouter une chambre"}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="space-y-4">
        {/* Capacity indicator */}
        <div className={`p-4 rounded-xl border-2 ${
          totalCapacity >= totalParticipants 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {totalCapacity >= totalParticipants ? (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className={`font-medium ${
                totalCapacity >= totalParticipants ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Capacité totale: {totalCapacity} places pour {totalParticipants} participants
              </span>
            </div>
          </div>
        </div>

        {/* Selected rooms summary */}
        {selectedRooms.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">Chambres sélectionnées:</p>
            <div className="space-y-1">
              {selectedRooms.map(sr => (
                <div key={sr.roomId} className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    {sr.room.name} × {sr.quantity}
                  </span>
                  <span className="text-gray-600">
                    {sr.room.capacity * sr.quantity} places
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="min-w-[150px] h-12 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <Button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="min-w-[200px] h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Répartir les participants
          </Button>
        </div>
      </div>

      {/* Pricing Modal */}
      {modalRoom && (
        <RoomPricingModal
          isOpen={!!modalRoom}
          onClose={() => setModalRoom(null)}
          room={modalRoom}
          selectedSubPeriods={selectedSubPeriods}
          allSubPeriods={allSubPeriods}
          ageRanges={ageRanges}
        />
      )}
    </div>
  );
};