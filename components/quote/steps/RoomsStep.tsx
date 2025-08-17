"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Plus, Minus, Users, Euro, AlertCircle, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Room } from '@/types/quote';
import type { SelectedRoom } from '@/types/multi-step-form';

interface RoomsStepProps {
  rooms: Room[];
  selectedRooms: SelectedRoom[];
  totalParticipants: number;
  totalCapacity: number;
  onUpdateRoomQuantity: (room: Room, quantity: number) => void;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export const RoomsStep: React.FC<RoomsStepProps> = ({
  rooms,
  selectedRooms,
  totalParticipants,
  totalCapacity,
  onUpdateRoomQuantity,
  canContinue,
  onContinue,
  onBack
}) => {
  const t = useTranslations('Public.QuoteForm');

  const getRoomQuantity = (roomId: string): number => {
    return selectedRooms.find(sr => sr.roomId === roomId)?.quantity || 0;
  };

  const canAddMoreRooms = (room: Room): boolean => {
    const currentQuantity = getRoomQuantity(room.id);
    const potentialCapacity = totalCapacity - (currentQuantity * room.capacity) + room.capacity;
    return potentialCapacity <= totalParticipants * 2; // Allow some flexibility
  };


  const getRoomPriceDetails = (room: Room) => {
    return room.roomPricings
      .filter(rp => rp.price > 0)
      .sort((a, b) => a.ageRange.order - b.ageRange.order)
      .map(rp => ({
        name: rp.ageRange.name,
        price: rp.price
      }));
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
                    {priceDetails.length > 0 ? (
                      priceDetails.map(pd => (
                        <div key={pd.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium text-gray-700">{pd.name}</span>
                          <span className="text-base font-bold text-gray-900">{pd.price}€</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Prix non configurés</p>
                    )}
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-600">Quantité:</span>
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
    </div>
  );
};