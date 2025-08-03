import { Hotel } from '@/domain/entities/Hotel';
import { HotelRepository } from '@/domain/ports/HotelRepository';
import { UpdateHotelDto } from '@/application/dto/hotel.dto';

export class UpdateHotelUseCase {
  constructor(private hotelRepository: HotelRepository) {}

  async execute(id: string, dto: UpdateHotelDto, organizationId: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findById(id, organizationId);
    if (!hotel) {
      throw new Error('Hôtel non trouvé');
    }

    hotel.update(dto);

    return await this.hotelRepository.update(id, dto, organizationId);
  }
}