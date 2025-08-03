import { Hotel } from '../entities/Hotel';

export interface HotelRepository {
  findById(id: string): Promise<Hotel | null>;
  findAll(): Promise<Hotel[]>;
  save(hotel: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Hotel>;
  update(id: string, hotel: Partial<Hotel>): Promise<Hotel>;
  delete(id: string): Promise<void>;
}