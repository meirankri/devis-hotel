import { Hotel } from '@/domain/entities/Hotel';
import { HotelRepository } from '@/domain/ports/HotelRepository';
import { CreateHotelDto } from '@/application/dto/hotel.dto';

export class CreateHotelUseCase {
  constructor(private hotelRepository: HotelRepository) {}

  async execute(dto: CreateHotelDto, organizationId: string): Promise<Hotel> {
    const hotelData = Hotel.create({
      name: dto.name,
      description: dto.description,
      address: dto.address,
      imageUrl: dto.imageUrl,
    });

    return await this.hotelRepository.save(hotelData, organizationId);
  }
}