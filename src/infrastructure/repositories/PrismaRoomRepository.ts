import { PrismaClient } from '@prisma/client';
import { Room } from '@/domain/entities/Room';
import { RoomRepository } from '@/domain/ports/RoomRepository';

export class PrismaRoomRepository implements RoomRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Room | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) return null;

    return new Room(
      room.id,
      room.hotelId,
      room.name,
      room.description,
      room.capacity,
      room.imageUrl,
      room.createdAt,
      room.updatedAt
    );
  }

  async findByHotelId(hotelId: string): Promise<Room[]> {
    const rooms = await this.prisma.room.findMany({
      where: { hotelId },
      orderBy: { name: 'asc' },
    });

    return rooms.map(
      room =>
        new Room(
          room.id,
          room.hotelId,
          room.name,
          room.description,
          room.capacity,
          room.imageUrl,
          room.createdAt,
          room.updatedAt
        )
    );
  }

  async findAll(): Promise<Room[]> {
    const rooms = await this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map(
      room =>
        new Room(
          room.id,
          room.hotelId,
          room.name,
          room.description,
          room.capacity,
          room.imageUrl,
          room.createdAt,
          room.updatedAt
        )
    );
  }

  async save(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room> {
    const created = await this.prisma.room.create({
      data: {
        hotelId: room.hotelId,
        name: room.name,
        description: room.description,
        capacity: room.capacity,
        imageUrl: room.imageUrl,
      },
    });

    return new Room(
      created.id,
      created.hotelId,
      created.name,
      created.description,
      created.capacity,
      created.imageUrl,
      created.createdAt,
      created.updatedAt
    );
  }

  async update(id: string, room: Partial<Room>): Promise<Room> {
    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        name: room.name,
        description: room.description,
        capacity: room.capacity,
        imageUrl: room.imageUrl,
      },
    });

    return new Room(
      updated.id,
      updated.hotelId,
      updated.name,
      updated.description,
      updated.capacity,
      updated.imageUrl,
      updated.createdAt,
      updated.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.room.delete({
      where: { id },
    });
  }

  async deleteByHotelId(hotelId: string): Promise<void> {
    await this.prisma.room.deleteMany({
      where: { hotelId },
    });
  }
}