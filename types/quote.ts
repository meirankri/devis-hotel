// Types for Quote Form
export interface AgeRange {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  order: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomPricing {
  id: string;
  roomId: string;
  ageRangeId: string;
  price: number;
  ageRange: AgeRange;
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  capacity: number;
  imageUrl: string | null;
  roomPricings: RoomPricing[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Hotel {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  imageUrl: string | null;
  rooms: Room[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stay {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string;
  hotelId: string;
  organizationId: string;
  allowPartialBooking: boolean;
  minDays: number | null;
  maxDays: number | null;
  isActive: boolean;
  imageUrl: string | null;
  hotel: Hotel;
  organization: Organization;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipantSelection {
  ageRangeId: string;
  ageRange: AgeRange;
  count: number;
}

export interface RoomOccupants {
  [ageRangeId: string]: number;
}

export interface RoomInstance {
  id: string;
  occupants: RoomOccupants;
}

export interface RoomSelection {
  roomId: string;
  room: Room;
  instances: RoomInstance[];
}

export interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  specialRequests?: string;
}

export interface QuoteSubmissionData extends QuoteFormData {
  stayId: string;
  rooms: Array<{
    roomId: string;
    quantity: number;
  }>;
  participants: Array<{
    ageRangeId: string;
    count: number;
  }>;
}