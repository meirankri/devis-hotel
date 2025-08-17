import { useState, useMemo, useCallback } from "react";
import type {
  ParticipantSelection,
  RoomSelection,
  RoomInstance,
  Room,
  AgeRange,
} from "@/types/quote";

interface UseQuoteFormProps {
  ageRanges: AgeRange[];
  rooms: Room[];
}

export const useQuoteForm = ({ ageRanges, rooms }: UseQuoteFormProps) => {
  const [participants, setParticipants] = useState<ParticipantSelection[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<RoomSelection[]>([]);
  const [currentStep, setCurrentStep] = useState<"participants" | "rooms">(
    "participants"
  );

  // Initialize participants
  const initializeParticipants = useCallback(() => {
    setParticipants(
      ageRanges.map((ar) => ({
        ageRangeId: ar.id,
        ageRange: ar,
        count: 0,
      }))
    );
  }, [ageRanges]);

  // Calculate total participants
  const totalParticipants = useMemo(
    () => participants.reduce((sum, p) => sum + p.count, 0),
    [participants]
  );

  // Filter available rooms
  const availableRooms = useMemo(() => {
    if (totalParticipants === 0) return [];

    return rooms.filter((room) => room.capacity <= totalParticipants);
  }, [rooms, totalParticipants]);

  // Calculate remaining participants
  const getRemainingParticipants = useCallback(
    (ageRangeId: string): number => {
      const totalForAgeRange =
        participants.find((p) => p.ageRangeId === ageRangeId)?.count || 0;
      const assignedForAgeRange = selectedRooms.reduce((sum, room) => {
        return (
          sum +
          room.instances.reduce((instSum, inst) => {
            return instSum + (inst.occupants[ageRangeId] || 0);
          }, 0)
        );
      }, 0);
      return totalForAgeRange - assignedForAgeRange;
    },
    [participants, selectedRooms]
  );

  // Calculate total assigned participants
  const totalAssignedParticipants = useMemo(() => {
    return selectedRooms.reduce((sum, room) => {
      return (
        sum +
        room.instances.reduce((instSum, inst) => {
          return (
            instSum + Object.values(inst.occupants).reduce((a, b) => a + b, 0)
          );
        }, 0)
      );
    }, 0);
  }, [selectedRooms]);

  // Update participant count
  const updateParticipantCount = useCallback(
    (ageRangeId: string, delta: number) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.ageRangeId === ageRangeId
            ? { ...p, count: Math.max(0, p.count + delta) }
            : p
        )
      );
    },
    []
  );

  // Add room
  const addRoom = useCallback((room: Room) => {
    setSelectedRooms((prev) => {
      const existingRoom = prev.find((r) => r.roomId === room.id);

      if (existingRoom) {
        return prev.map((r) =>
          r.roomId === room.id
            ? {
                ...r,
                instances: [
                  ...r.instances,
                  {
                    id: `${room.id}-${Date.now()}`,
                    occupants: {},
                  },
                ],
              }
            : r
        );
      }

      return [
        ...prev,
        {
          roomId: room.id,
          room,
          instances: [
            {
              id: `${room.id}-${Date.now()}`,
              occupants: {},
            },
          ],
        },
      ];
    });
  }, []);

  // Remove room instance
  const removeRoomInstance = useCallback(
    (roomId: string, instanceId: string) => {
      setSelectedRooms((prev) => {
        return prev
          .map((r) => {
            if (r.roomId === roomId) {
              const newInstances = r.instances.filter(
                (i) => i.id !== instanceId
              );
              return newInstances.length > 0
                ? { ...r, instances: newInstances }
                : null;
            }
            return r;
          })
          .filter(Boolean) as RoomSelection[];
      });
    },
    []
  );

  return {
    participants,
    selectedRooms,
    setSelectedRooms,
    currentStep,
    totalParticipants,
    availableRooms,
    totalAssignedParticipants,
    setCurrentStep,
    initializeParticipants,
    updateParticipantCount,
    addRoom,
    removeRoomInstance,
    getRemainingParticipants,
  };
};
