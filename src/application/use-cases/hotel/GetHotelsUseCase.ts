import { Hotel } from '@/domain/entities/Hotel';
import { HotelRepository } from '@/domain/ports/HotelRepository';

export class GetHotelsUseCase {
  constructor(private hotelRepository: HotelRepository) {}

  async execute(): Promise<Hotel[]> {
    return await this.hotelRepository.findAll();
  }

  async getById(id: string): Promise<Hotel | null> {
    return await this.hotelRepository.findById(id);
  }
}