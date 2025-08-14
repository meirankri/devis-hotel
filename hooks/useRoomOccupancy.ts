import { useCallback } from "react";
import type { RoomInstance, RoomSelection } from "@/types/quote";

export const useRoomOccupancy = (
  selectedRooms: RoomSelection[],
  setSelectedRooms: React.Dispatch<React.SetStateAction<RoomSelection[]>>,
  getRemainingParticipants: (ageRangeId: string) => number
) => {
  // Calculate room instance occupancy
  const getRoomInstanceOccupancy = useCallback((instance: RoomInstance): number => {
    return Object.values(instance.occupants).reduce((sum, count) => sum + count, 0);
  }, []);

  // Update room occupants with validation
  const updateRoomOccupants = useCallback(
    (roomId: string, instanceId: string, ageRangeId: string, delta: number) => {
      setSelectedRooms((prev) =>
        prev.map((r) => {
          if (r.roomId === roomId) {
            return {
              ...r,
              instances: r.instances.map((i) => {
                if (i.id === instanceId) {
                  const currentCount = i.occupants[ageRangeId] || 0;
                  const newCount = Math.max(0, currentCount + delta);
                  const remaining = getRemainingParticipants(ageRangeId);
                  const maxAllowed = currentCount + remaining;
                  const finalCount = Math.min(newCount, maxAllowed);

                  // Check room capacity
                  const currentOccupancy = getRoomInstanceOccupancy(i);
                  const otherOccupants = currentOccupancy - currentCount;
                  const maxByCapacity = r.room.capacity - otherOccupants;

                  return {
                    ...i,
                    occupants: {
                      ...i.occupants,
                      [ageRangeId]: Math.min(finalCount, currentCount + Math.max(0, maxByCapacity)),
                    },
                  };
                }
                return i;
              }),
            };
          }
          return r;
        })
      );
    },
    [getRemainingParticipants, getRoomInstanceOccupancy, setSelectedRooms]
  );

  return {
    getRoomInstanceOccupancy,
    updateRoomOccupants,
  };
};