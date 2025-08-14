import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Room, RoomInstance as RoomInstanceType, ParticipantSelection } from "@/types/quote";

interface RoomInstanceProps {
  room: Room;
  instance: RoomInstanceType;
  index: number;
  participants: ParticipantSelection[];
  occupancy: number;
  price: number;
  getRemainingParticipants: (ageRangeId: string) => number;
  onUpdateOccupants: (ageRangeId: string, delta: number) => void;
  onRemove: () => void;
}

export const RoomInstance: React.FC<RoomInstanceProps> = ({
  room,
  instance,
  index,
  participants,
  occupancy,
  price,
  getRemainingParticipants,
  onUpdateOccupants,
  onRemove,
}) => {
  const t = useTranslations("Public.QuoteForm");
  const isOverCapacity = occupancy > room.capacity;

  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        isOverCapacity
          ? "bg-red-50 border-red-300"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h5 className="font-semibold text-gray-900 text-lg">
            {room.name} #{index + 1}
          </h5>
          <p className="text-sm text-gray-600">
            Capacité: {occupancy}/{room.capacity} {t("persons")}
          </p>
          
          {/* Room description */}
          {room.description && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                <div 
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: room.description }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {price > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Prix total séjour</p>
              <p className="text-xl font-bold text-blue-600">
                {price.toFixed(2)}€
              </p>
            </div>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isOverCapacity && (
        <div className="mb-4 p-3 bg-red-100 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ Capacité dépassée !
          </p>
        </div>
      )}

      <div className="space-y-3">
        {participants.map((participant) => {
          if (participant.count === 0) return null;
          
          const assignedCount = instance.occupants[participant.ageRangeId] || 0;
          const remaining = getRemainingParticipants(participant.ageRangeId);
          const pricing = room.roomPricings.find(
            rp => rp.ageRangeId === participant.ageRangeId
          );

          return (
            <div
              key={participant.ageRangeId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {participant.ageRange.name}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {pricing && (
                    <span className="text-blue-600 font-medium">
                      {pricing.price}€/pers pour le séjour
                    </span>
                  )}
                  {remaining > 0 && assignedCount === 0 && (
                    <span className="text-orange-600">
                      {remaining} à placer
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUpdateOccupants(participant.ageRangeId, -1)}
                  disabled={assignedCount === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-8 text-center font-semibold">
                  {assignedCount}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onUpdateOccupants(participant.ageRangeId, 1)}
                  disabled={remaining === 0 || occupancy >= room.capacity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price breakdown */}
      {Object.entries(instance.occupants).some(([_, count]) => count > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-1 text-sm">
            {Object.entries(instance.occupants).map(([ageRangeId, count]) => {
              if (count === 0) return null;
              const pricing = room.roomPricings.find(rp => rp.ageRangeId === ageRangeId);
              if (!pricing) return null;
              
              return (
                <div key={ageRangeId} className="flex justify-between text-gray-600">
                  <span>{pricing.ageRange.name}: {count} × {pricing.price}€</span>
                  <span>{(count * pricing.price).toFixed(2)}€</span>
                </div>
              );
            })}
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
              <span>Total chambre</span>
              <span className="text-blue-600">{price.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};