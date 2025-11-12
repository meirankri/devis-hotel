// Types for Multi-Step Quote Form
import type { Room, AgeRange, RoomPricing } from './quote';

export type FormStep = 'subPeriods' | 'participants' | 'rooms' | 'assignment';

export interface SelectedSubPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
}

export interface ParticipantData {
  ageRangeId: string;
  ageRange: AgeRange;
  count: number;
}

export interface SelectedRoom {
  roomId: string;
  room: Room;
  quantity: number;
}

export interface RoomAssignment {
  roomId: string;
  instanceNumber: number; // 1, 2, 3... for multiple instances of same room
  roomName: string;
  capacity: number;
  participants: Record<string, number>; // ageRangeId -> count
}

export interface MultiStepFormData {
  // Step 1: SubPeriods
  selectedSubPeriods: SelectedSubPeriod[];

  // Step 2: Participants
  participants: ParticipantData[];
  totalParticipants: number;

  // Step 3: Room Selection
  selectedRooms: SelectedRoom[];
  totalCapacity: number;

  // Step 4: Room Assignments
  roomAssignments: RoomAssignment[];
}

// Validation helpers
export interface StepValidation {
  isValid: boolean;
  errors: string[];
}

// Price calculation
export interface PriceBreakdown {
  roomId: string;
  instanceNumber: number;
  roomName: string;
  pricePerNight: number;
  nights: number;
  totalPrice: number;
  details: Array<{
    ageRangeName: string;
    count: number;
    pricePerPerson: number;
    subtotal: number;
  }>;
}