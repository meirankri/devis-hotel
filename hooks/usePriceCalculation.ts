import { useMemo, useCallback } from "react";
import type { Room, RoomInstance, RoomSelection } from "@/types/quote";

export const usePriceCalculation = (selectedRooms: RoomSelection[]) => {
  // Calculate room instance price (price is for the entire stay, not per night)
  const calculateRoomInstancePrice = useCallback((room: Room, instance: RoomInstance): number => {
    let totalPrice = 0;
    
    Object.entries(instance.occupants).forEach(([ageRangeId, count]) => {
      const pricing = room.roomPricings.find((rp) => rp.ageRangeId === ageRangeId);
      if (pricing && count > 0) {
        // Price is already for the entire stay
        totalPrice += pricing.price * count;
      }
    });
    
    return totalPrice;
  }, []);

  // Calculate total price for all rooms
  const totalPrice = useMemo((): number => {
    return selectedRooms.reduce((sum, { room, instances }) => {
      return sum + instances.reduce((instSum, inst) => {
        return instSum + calculateRoomInstancePrice(room, inst);
      }, 0);
    }, 0);
  }, [selectedRooms, calculateRoomInstancePrice]);

  // Get price breakdown by age range for a room
  const getPriceBreakdown = useCallback((room: Room, instance: RoomInstance) => {
    const breakdown: Array<{
      ageRangeName: string;
      count: number;
      pricePerPerson: number;
      subtotal: number;
    }> = [];

    Object.entries(instance.occupants).forEach(([ageRangeId, count]) => {
      if (count > 0) {
        const pricing = room.roomPricings.find((rp) => rp.ageRangeId === ageRangeId);
        if (pricing) {
          breakdown.push({
            ageRangeName: pricing.ageRange.name,
            count,
            pricePerPerson: pricing.price,
            subtotal: pricing.price * count,
          });
        }
      }
    });

    return breakdown;
  }, []);

  return {
    calculateRoomInstancePrice,
    totalPrice,
    getPriceBreakdown,
  };
};