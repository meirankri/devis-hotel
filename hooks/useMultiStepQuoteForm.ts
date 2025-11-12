import { useState, useCallback, useMemo } from 'react';
import type {
  FormStep,
  ParticipantData,
  SelectedRoom,
  RoomAssignment,
  StepValidation,
  PriceBreakdown,
  SelectedSubPeriod
} from '@/types/multi-step-form';
import type { Room, AgeRange, StaySubPeriod } from '@/types/quote';

interface UseMultiStepQuoteFormProps {
  ageRanges: AgeRange[];
  rooms: Room[];
  subPeriods: StaySubPeriod[];
  checkIn: string;
  checkOut: string;
}

export const useMultiStepQuoteForm = ({
  ageRanges,
  rooms,
  subPeriods,
  checkIn,
  checkOut
}: UseMultiStepQuoteFormProps) => {
  // Form state
  const [currentStep, setCurrentStep] = useState<FormStep>('subPeriods');
  const [participants, setParticipants] = useState<ParticipantData[]>(
    ageRanges.map(ar => ({
      ageRangeId: ar.id,
      ageRange: ar,
      count: 0
    }))
  );
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([]);
  const [selectedSubPeriods, setSelectedSubPeriods] = useState<SelectedSubPeriod[]>([]);

  // Calculate total participants
  const totalParticipants = useMemo(
    () => participants.reduce((sum, p) => sum + p.count, 0),
    [participants]
  );

  // Calculate total capacity
  const totalCapacity = useMemo(
    () => selectedRooms.reduce((sum, sr) => sum + (sr.room.capacity * sr.quantity), 0),
    [selectedRooms]
  );

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // Update sub-period selection
  const updateSubPeriodSelection = useCallback((subPeriodId: string, selected: boolean) => {
    setSelectedSubPeriods(prev => {
      if (selected) {
        const subPeriod = subPeriods.find(sp => sp.id === subPeriodId);
        if (subPeriod && !prev.some(sp => sp.id === subPeriodId)) {
          return [...prev, {
            id: subPeriod.id,
            name: subPeriod.name,
            startDate: subPeriod.startDate,
            endDate: subPeriod.endDate,
            order: subPeriod.order
          }];
        }
      } else {
        return prev.filter(sp => sp.id !== subPeriodId);
      }
      return prev;
    });
  }, [subPeriods]);

  // Update participant count
  const updateParticipantCount = useCallback((ageRangeId: string, count: number) => {
    setParticipants(prev =>
      prev.map(p =>
        p.ageRangeId === ageRangeId
          ? { ...p, count: Math.max(0, count) }
          : p
      )
    );
  }, []);

  // Add or update room selection
  const updateRoomQuantity = useCallback((room: Room, quantity: number) => {
    setSelectedRooms(prev => {
      const existing = prev.find(sr => sr.roomId === room.id);
      
      if (quantity === 0) {
        // Remove room if quantity is 0
        return prev.filter(sr => sr.roomId !== room.id);
      }
      
      if (existing) {
        // Update existing room quantity
        return prev.map(sr => 
          sr.roomId === room.id 
            ? { ...sr, quantity }
            : sr
        );
      }
      
      // Add new room
      return [...prev, { roomId: room.id, room, quantity }];
    });
  }, []);

  // Initialize room assignments when moving to step 3
  const initializeRoomAssignments = useCallback(() => {
    const assignments: RoomAssignment[] = [];
    
    selectedRooms.forEach(({ room, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        assignments.push({
          roomId: room.id,
          instanceNumber: i + 1,
          roomName: room.name,
          capacity: room.capacity,
          participants: {} // Will be filled by user
        });
      }
    });
    
    setRoomAssignments(assignments);
  }, [selectedRooms]);

  // Update room assignment participants
  const updateRoomAssignment = useCallback((
    roomId: string,
    instanceNumber: number,
    ageRangeId: string,
    count: number
  ) => {
    setRoomAssignments(prev => 
      prev.map(ra => 
        ra.roomId === roomId && ra.instanceNumber === instanceNumber
          ? {
              ...ra,
              participants: {
                ...ra.participants,
                [ageRangeId]: Math.max(0, count)
              }
            }
          : ra
      )
    );
  }, []);

  // Get remaining participants for an age range
  const getRemainingParticipants = useCallback((ageRangeId: string): number => {
    const total = participants.find(p => p.ageRangeId === ageRangeId)?.count || 0;
    const assigned = roomAssignments.reduce((sum, ra) => 
      sum + (ra.participants[ageRangeId] || 0), 0
    );
    return total - assigned;
  }, [participants, roomAssignments]);

  // Get total assigned participants
  const totalAssignedParticipants = useMemo(() => {
    return roomAssignments.reduce((sum, ra) => 
      sum + Object.values(ra.participants).reduce((s, c) => s + c, 0), 0
    );
  }, [roomAssignments]);

  // Validate current step
  const validateStep = useCallback((step: FormStep): StepValidation => {
    const errors: string[] = [];

    switch (step) {
      case 'subPeriods':
        if (subPeriods.length > 0 && selectedSubPeriods.length === 0) {
          errors.push('Veuillez sélectionner au moins une période');
        }
        break;

      case 'participants':
        if (totalParticipants === 0) {
          errors.push('Veuillez sélectionner au moins un participant');
        }
        break;
        
      case 'rooms':
        if (selectedRooms.length === 0) {
          errors.push('Veuillez sélectionner au moins une chambre');
        }
        if (totalCapacity < totalParticipants) {
          errors.push(`La capacité totale (${totalCapacity}) est insuffisante pour ${totalParticipants} participants`);
        }
        break;
        
      case 'assignment':
        if (totalAssignedParticipants !== totalParticipants) {
          errors.push(`Tous les participants doivent être assignés (${totalAssignedParticipants}/${totalParticipants})`);
        }
        // Check each room doesn't exceed capacity
        roomAssignments.forEach(ra => {
          const occupancy = Object.values(ra.participants).reduce((s, c) => s + c, 0);
          if (occupancy > ra.capacity) {
            errors.push(`${ra.roomName} #${ra.instanceNumber}: capacité dépassée (${occupancy}/${ra.capacity})`);
          }
        });
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [subPeriods, selectedSubPeriods, totalParticipants, selectedRooms, totalCapacity, totalAssignedParticipants, roomAssignments]);

  // Calculate price breakdown (prices are per stay, not per night)
  const calculatePriceBreakdown = useCallback((): PriceBreakdown[] => {
    const breakdown: PriceBreakdown[] = [];

    roomAssignments.forEach(ra => {
      const room = rooms.find(r => r.id === ra.roomId);
      if (!room) return;

      const details = Object.entries(ra.participants)
        .filter(([_, count]) => count > 0)
        .map(([ageRangeId, count]) => {
          const ageRange = ageRanges.find(ar => ar.id === ageRangeId);

          // Calculer le prix en fonction des sous-périodes sélectionnées
          let pricePerPerson = 0;

          if (selectedSubPeriods.length > 0) {
            // Sommer les prix de chaque sous-période sélectionnée
            selectedSubPeriods.forEach(subPeriod => {
              const pricingForPeriod = room.roomPricings.find(
                rp => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriod.id
              );

              // Si pas de prix pour cette sous-période, utiliser le prix global
              const fallbackPricing = room.roomPricings.find(
                rp => rp.ageRangeId === ageRangeId && rp.subPeriodId === null
              );

              pricePerPerson += pricingForPeriod?.price || fallbackPricing?.price || 0;
            });
          } else {
            // Si pas de sous-périodes, utiliser le prix global
            const globalPricing = room.roomPricings.find(
              rp => rp.ageRangeId === ageRangeId && rp.subPeriodId === null
            );
            pricePerPerson = globalPricing?.price || 0;
          }

          return {
            ageRangeName: ageRange?.name || '',
            count,
            pricePerPerson,
            subtotal: pricePerPerson * count // Prix total pour toutes les sous-périodes
          };
        });
      
      const totalPrice = details.reduce((sum, d) => sum + d.subtotal, 0);
      
      breakdown.push({
        roomId: ra.roomId,
        instanceNumber: ra.instanceNumber,
        roomName: ra.roomName,
        pricePerNight: totalPrice / nights, // Pour affichage seulement
        nights,
        totalPrice, // Prix total pour le séjour entier
        details
      });
    });
    
    return breakdown;
  }, [roomAssignments, rooms, ageRanges, nights, selectedSubPeriods]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const breakdown = calculatePriceBreakdown();
    return breakdown.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [calculatePriceBreakdown]);

  // Navigation
  const goToStep = useCallback((step: FormStep) => {
    // Initialize room assignments when going to assignment step
    if (step === 'assignment' && roomAssignments.length === 0) {
      initializeRoomAssignments();
    }
    setCurrentStep(step);
  }, [roomAssignments.length, initializeRoomAssignments]);

  const canGoNext = useMemo(() => {
    return validateStep(currentStep).isValid;
  }, [currentStep, validateStep]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;

    switch (currentStep) {
      case 'subPeriods':
        goToStep('participants');
        break;
      case 'participants':
        goToStep('rooms');
        break;
      case 'rooms':
        goToStep('assignment');
        break;
    }
  }, [currentStep, canGoNext, goToStep]);

  const goPrevious = useCallback(() => {
    switch (currentStep) {
      case 'participants':
        goToStep('subPeriods');
        break;
      case 'rooms':
        goToStep('participants');
        break;
      case 'assignment':
        goToStep('rooms');
        break;
    }
  }, [currentStep, goToStep]);

  return {
    // State
    currentStep,
    participants,
    selectedRooms,
    roomAssignments,
    selectedSubPeriods,
    totalParticipants,
    totalCapacity,
    totalAssignedParticipants,
    nights,
    totalPrice,

    // Actions
    updateParticipantCount,
    updateRoomQuantity,
    updateRoomAssignment,
    updateSubPeriodSelection,
    getRemainingParticipants,

    // Validation
    validateStep,
    canGoNext,

    // Navigation
    goToStep,
    goNext,
    goPrevious,

    // Price calculation
    calculatePriceBreakdown
  };
};