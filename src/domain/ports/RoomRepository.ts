import { Room } from '../entities/Room';

export interface RoomRepository {
  findById(id: string, organizationId: string): Promise<Room | null>;
  findByHotelId(hotelId: string, organizationId: string): Promise<Room[]>;
  findAllByOrganization(organizationId: string): Promise<Room[]>;
  save(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<Room>;
  update(id: string, room: Partial<Room>, organizationId: string): Promise<Room>;
  delete(id: string, organizationId: string): Promise<void>;
  deleteByHotelId(hotelId: string, organizationId: string): Promise<void>;
}