import { PrismaClient } from "@prisma/client";
import { Hotel } from "@/domain/entities/Hotel";
import { HotelRepository } from "@/domain/ports/HotelRepository";

export class PrismaHotelRepository implements HotelRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<Hotel | null> {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id, organizationId },
    });

    if (!hotel) return null;

    return new Hotel(
      hotel.id,
      hotel.name,
      hotel.description,
      hotel.address,
      hotel.imageUrl,
      hotel.createdAt,
      hotel.updatedAt
    );
  }

  async findAllByOrganization(organizationId: string): Promise<Hotel[]> {
    const hotels = await this.prisma.hotel.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return hotels.map(
      (hotel) =>
        new Hotel(
          hotel.id,
          hotel.name,
          hotel.description,
          hotel.address,
          hotel.imageUrl,
          hotel.createdAt,
          hotel.updatedAt
        )
    );
  }

  async save(
    hotel: Omit<Hotel, "id" | "createdAt" | "updatedAt">,
    organizationId: string
  ): Promise<Hotel> {
    const created = await this.prisma.hotel.create({
      data: {
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        imageUrl: hotel.imageUrl,
        organizationId,
      },
    });

    return new Hotel(
      created.id,
      created.name,
      created.description,
      created.address,
      created.imageUrl,
      created.createdAt,
      created.updatedAt
    );
  }

  async update(id: string, hotel: Partial<Hotel>, organizationId: string): Promise<Hotel> {
    const updated = await this.prisma.hotel.update({
      where: { id, organizationId },
      data: {
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        imageUrl: hotel.imageUrl,
      },
    });

    return new Hotel(
      updated.id,
      updated.name,
      updated.description,
      updated.address,
      updated.imageUrl,
      updated.createdAt,
      updated.updatedAt
    );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.hotel.deleteMany({
      where: { id, organizationId },
    });
  }
}
