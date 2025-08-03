import { Hotel } from '@/domain/entities/Hotel';
import { HotelRepository } from '@/domain/ports/HotelRepository';

export class GetHotelsUseCase {
  constructor(private hotelRepository: HotelRepository) {}

  async execute(organizationId: string): Promise<Hotel[]> {
    return await this.hotelRepository.findAllByOrganization(organizationId);
  }

  async getById(id: string, organizationId: string): Promise<Hotel | null> {
    return await this.hotelRepository.findById(id, organizationId);
  }
}