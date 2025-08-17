"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCheck, Plus, Minus, AlertCircle, ChevronLeft, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RoomAssignment, ParticipantData } from '@/types/multi-step-form';
import type { Room } from '@/types/quote';

interface AssignmentStepProps {
  roomAssignments: RoomAssignment[];
  participants: ParticipantData[];
  rooms: Room[];
  totalParticipants: number;
  totalAssignedParticipants: number;
  totalPrice: number;
  onUpdateAssignment: (
    roomId: string,
    instanceNumber: number,
    ageRangeId: string,
    count: number
  ) => void;
  getRemainingParticipants: (ageRangeId: string) => number;
  canContinue: boolean;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const AssignmentStep: React.FC<AssignmentStepProps> = ({
  roomAssignments,
  participants,
  rooms,
  totalParticipants,
  totalAssignedParticipants,
  totalPrice,
  onUpdateAssignment,
  getRemainingParticipants,
  canContinue,
  onBack,
  isSubmitting = false
}) => {
  const t = useTranslations('Public.QuoteForm');

  const getRoomOccupancy = (assignment: RoomAssignment): number => {
    return Object.values(assignment.participants).reduce((sum, count) => sum + count, 0);
  };

  const isRoomFull = (assignment: RoomAssignment): boolean => {
    return getRoomOccupancy(assignment) >= assignment.capacity;
  };

  const canAddParticipant = (
    assignment: RoomAssignment,
    ageRangeId: string
  ): boolean => {
    const roomOccupancy = getRoomOccupancy(assignment);
    const remaining = getRemainingParticipants(ageRangeId);
    return roomOccupancy < assignment.capacity && remaining > 0;
  };

  const canRemoveParticipant = (
    assignment: RoomAssignment,
    ageRangeId: string
  ): boolean => {
    return (assignment.participants[ageRangeId] || 0) > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Répartition dans les chambres</h3>
            <p className="text-gray-600 mt-1">
              Assignez chaque participant à une chambre
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
          Modifier les chambres
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression de l'assignation</span>
          <span className="text-sm font-bold text-gray-900">
            {totalAssignedParticipants} / {totalParticipants} participants
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              totalAssignedParticipants === totalParticipants
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${(totalAssignedParticipants / totalParticipants) * 100}%` }}
          />
        </div>
      </div>

      {/* Remaining participants summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {participants.filter(p => p.count > 0).map(participant => {
          const remaining = getRemainingParticipants(participant.ageRangeId);
          const isComplete = remaining === 0;
          
          return (
            <div
              key={participant.ageRangeId}
              className={`p-3 rounded-lg border-2 ${
                isComplete
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">{participant.ageRange.name}</p>
                  <p className={`text-lg font-bold ${
                    isComplete ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {remaining} restant{remaining > 1 ? 's' : ''}
                  </p>
                </div>
                {isComplete && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room assignments */}
      <div className="space-y-4">
        {roomAssignments.map((assignment) => {
          const occupancy = getRoomOccupancy(assignment);
          const isFull = isRoomFull(assignment);
          const room = rooms.find(r => r.id === assignment.roomId);
          
          return (
            <div
              key={`${assignment.roomId}-${assignment.instanceNumber}`}
              className={`bg-white rounded-2xl shadow-lg border-2 p-6 ${
                isFull ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              {/* Room header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">
                    {assignment.roomName} #{assignment.instanceNumber}
                  </h4>
                  <p className={`text-sm ${
                    occupancy > assignment.capacity
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-600'
                  }`}>
                    {occupancy} / {assignment.capacity} personne{assignment.capacity > 1 ? 's' : ''}
                  </p>
                  
                  {/* Prix par tranche d'âge */}
                  {room && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {room.roomPricings
                        .filter(rp => rp.price > 0)
                        .sort((a, b) => a.ageRange.order - b.ageRange.order)
                        .map(rp => (
                          <span key={rp.id} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                            {rp.ageRange.name}: {rp.price}€
                          </span>
                        ))
                      }
                    </div>
                  )}
                </div>
                {isFull && (
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Complète
                  </div>
                )}
                {occupancy > assignment.capacity && (
                  <div className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Surcharge
                  </div>
                )}
              </div>

              {/* Participant selectors */}
              <div className="space-y-3">
                {participants.filter(p => p.count > 0).map(participant => {
                  const currentCount = assignment.participants[participant.ageRangeId] || 0;
                  const canAdd = canAddParticipant(assignment, participant.ageRangeId);
                  const canRemove = canRemoveParticipant(assignment, participant.ageRangeId);
                  
                  return (
                    <div
                      key={participant.ageRangeId}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {participant.ageRange.name}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => onUpdateAssignment(
                            assignment.roomId,
                            assignment.instanceNumber,
                            participant.ageRangeId,
                            currentCount - 1
                          )}
                          disabled={!canRemove}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <div className="w-10 text-center">
                          <span className={`text-lg font-bold ${
                            currentCount > 0 ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {currentCount}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => onUpdateAssignment(
                            assignment.roomId,
                            assignment.instanceNumber,
                            participant.ageRangeId,
                            currentCount + 1
                          )}
                          disabled={!canAdd}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation message */}
      {!canContinue && totalAssignedParticipants < totalParticipants && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Assignation incomplète
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Tous les participants doivent être assignés à une chambre avant de continuer.
                Il reste {totalParticipants - totalAssignedParticipants} participant{totalParticipants - totalAssignedParticipants > 1 ? 's' : ''} à placer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prix total */}
      {canContinue && totalPrice > 0 && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Prix total du séjour</p>
              <p className="text-4xl font-bold">{totalPrice.toFixed(2)}€</p>
              <p className="text-green-100 text-sm mt-1">
                Tous les participants sont assignés ✓
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="p-4 bg-white/20 rounded-xl">
                <Check className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-start pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="min-w-[150px] h-12 rounded-xl"
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    </div>
  );
};