import { Room } from '../entities/Room';

export interface RoomRepository {
  findById(id: string): Promise<Room | null>;
  findByHotelId(hotelId: string): Promise<Room[]>;
  findAll(): Promise<Room[]>;
  save(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room>;
  update(id: string, room: Partial<Room>): Promise<Room>;
  delete(id: string): Promise<void>;
  deleteByHotelId(hotelId: string): Promise<void>;
}