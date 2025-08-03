import { Hotel } from '../entities/Hotel';

export interface HotelRepository {
  findById(id: string, organizationId: string): Promise<Hotel | null>;
  findAllByOrganization(organizationId: string): Promise<Hotel[]>;
  save(hotel: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<Hotel>;
  update(id: string, hotel: Partial<Hotel>, organizationId: string): Promise<Hotel>;
  delete(id: string, organizationId: string): Promise<void>;
}