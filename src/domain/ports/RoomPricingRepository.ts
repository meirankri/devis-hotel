import { RoomPricing } from '../entities/RoomPricing';

export interface RoomPricingRepository {
  findById(id: string): Promise<RoomPricing | null>;
  findByRoomId(roomId: string): Promise<RoomPricing[]>;
  findByRoomAndAgeRange(roomId: string, ageRangeId: string): Promise<RoomPricing | null>;
  save(pricing: Omit<RoomPricing, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoomPricing>;
  update(id: string, pricing: Partial<RoomPricing>): Promise<RoomPricing>;
  updateMultipleRooms(roomIds: string[], ageRangeId: string, price: number): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByRoomId(roomId: string): Promise<void>;
}