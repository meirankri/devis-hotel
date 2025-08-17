import React from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { RoomCard } from "./RoomCard";
import { RoomInstance } from "./RoomInstance";
import type { Room, RoomSelection, ParticipantSelection } from "@/types/quote";

interface RoomSelectorProps {
  totalParticipants: number;
  availableRooms: Room[];
  selectedRooms: RoomSelection[];
  participants: ParticipantSelection[];
  totalAssignedParticipants: number;
  totalPrice: number;
  onAddRoom: (room: Room) => void;
  onRemoveRoomInstance: (roomId: string, instanceId: string) => void;
  onUpdateOccupants: (
    roomId: string,
    instanceId: string,
    ageRangeId: string,
    delta: number
  ) => void;
  getRemainingParticipants: (ageRangeId: string) => number;
  getRoomInstanceOccupancy: (instance: any) => number;
  calculateRoomInstancePrice: (room: Room, instance: any) => number;
  onBack: () => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  totalParticipants,
  availableRooms,
  selectedRooms,
  participants,
  totalAssignedParticipants,
  totalPrice,
  onAddRoom,
  onRemoveRoomInstance,
  onUpdateOccupants,
  getRemainingParticipants,
  getRoomInstanceOccupancy,
  calculateRoomInstancePrice,
  onBack,
}) => {
  const t = useTranslations("Public.QuoteForm");

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {t("roomSelection")}
          </h3>
        </div>

        <Button type="button" onClick={onBack} variant="outline">
          Modifier les participants
        </Button>
      </div>

      {/* Available rooms to add */}
      <div className="mb-6">
        <p className="text-gray-700 font-medium mb-3">Ajouter des chambres :</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => onAddRoom(room)}
            />
          ))}
        </div>
      </div>

      {/* Selected rooms */}
      {selectedRooms.length > 0 && (
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900">
            Chambres sélectionnées :
          </h4>

          <div className="flex gap-4">
            {selectedRooms.map(({ roomId, room, instances }) => (
              <div key={roomId} className="space-y-4">
                {instances.map((instance, index) => (
                  <RoomInstance
                    key={instance.id}
                    room={room}
                    instance={instance}
                    index={index}
                    participants={participants}
                    occupancy={getRoomInstanceOccupancy(instance)}
                    price={calculateRoomInstancePrice(room, instance)}
                    getRemainingParticipants={getRemainingParticipants}
                    onUpdateOccupants={(ageRangeId, delta) =>
                      onUpdateOccupants(roomId, instance.id, ageRangeId, delta)
                    }
                    onRemove={() => onRemoveRoomInstance(roomId, instance.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedRooms.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-100 text-sm">Participants placés</p>
              <p className="text-2xl font-bold">
                {totalAssignedParticipants}/{totalParticipants}
              </p>
            </div>

            <div>
              <p className="text-blue-100 text-sm">Chambres</p>
              <p className="text-2xl font-bold">
                {selectedRooms.reduce((sum, r) => sum + r.instances.length, 0)}
              </p>
            </div>

            <div>
              <p className="text-blue-100 text-sm">Prix total</p>
              <p className="text-3xl font-bold">{totalPrice.toFixed(2)}€</p>
            </div>
          </div>

          {totalAssignedParticipants !== totalParticipants && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg">
              <p className="text-sm font-medium">
                ⚠️ Tous les participants doivent être assignés aux chambres
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
