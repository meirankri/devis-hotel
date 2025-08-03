import { HotelRepository } from '@/domain/ports/HotelRepository';

export class DeleteHotelUseCase {
  constructor(private hotelRepository: HotelRepository) {}

  async execute(id: string, organizationId: string): Promise<void> {
    const hotel = await this.hotelRepository.findById(id, organizationId);
    if (!hotel) {
      throw new Error('Hôtel non trouvé');
    }

    await this.hotelRepository.delete(id, organizationId);
  }
}