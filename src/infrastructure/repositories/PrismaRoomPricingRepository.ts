import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RoomPricing } from '@/domain/entities/RoomPricing';
import { RoomPricingRepository } from '@/domain/ports/RoomPricingRepository';

export class PrismaRoomPricingRepository implements RoomPricingRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<RoomPricing | null> {
    const pricing = await this.prisma.roomPricing.findUnique({
      where: { id },
    });

    if (!pricing) return null;

    return new RoomPricing(
      pricing.id,
      pricing.roomId,
      pricing.ageRangeId,
      pricing.price,
      pricing.createdAt,
      pricing.updatedAt
    );
  }

  async findByRoomId(roomId: string): Promise<RoomPricing[]> {
    const pricings = await this.prisma.roomPricing.findMany({
      where: { roomId },
      include: {
        ageRange: true,
      },
      orderBy: {
        ageRange: {
          order: 'asc',
        },
      },
    });

    return pricings.map(
      pricing =>
        new RoomPricing(
          pricing.id,
          pricing.roomId,
          pricing.ageRangeId,
          pricing.price,
          pricing.createdAt,
          pricing.updatedAt
        )
    );
  }

  async findByRoomAndAgeRange(roomId: string, ageRangeId: string): Promise<RoomPricing | null> {
    const pricing = await this.prisma.roomPricing.findFirst({
      where: {
        roomId,
        ageRangeId,
        subPeriodId: null,
      },
    });

    if (!pricing) return null;

    return new RoomPricing(
      pricing.id,
      pricing.roomId,
      pricing.ageRangeId,
      pricing.price,
      pricing.createdAt,
      pricing.updatedAt
    );
  }

  async save(pricing: Omit<RoomPricing, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoomPricing> {
    const created = await this.prisma.roomPricing.create({
      data: {
        roomId: pricing.roomId,
        ageRangeId: pricing.ageRangeId,
        price: pricing.price,
      },
    });

    return new RoomPricing(
      created.id,
      created.roomId,
      created.ageRangeId,
      created.price,
      created.createdAt,
      created.updatedAt
    );
  }

  async update(id: string, pricing: Partial<RoomPricing>): Promise<RoomPricing> {
    const updated = await this.prisma.roomPricing.update({
      where: { id },
      data: {
        price: pricing.price,
      },
    });

    return new RoomPricing(
      updated.id,
      updated.roomId,
      updated.ageRangeId,
      updated.price,
      updated.createdAt,
      updated.updatedAt
    );
  }

  async updateMultipleRooms(roomIds: string[], ageRangeId: string, price: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const roomId of roomIds) {
        const existing = await tx.roomPricing.findFirst({
          where: {
            roomId,
            ageRangeId,
            subPeriodId: null,
          },
        });

        if (existing) {
          await tx.roomPricing.update({
            where: { id: existing.id },
            data: {
              price: new Decimal(price),
            },
          });
        } else {
          await tx.roomPricing.create({
            data: {
              roomId,
              ageRangeId,
              subPeriodId: null,
              price: new Decimal(price),
            },
          });
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.roomPricing.delete({
      where: { id },
    });
  }

  async deleteByRoomId(roomId: string): Promise<void> {
    await this.prisma.roomPricing.deleteMany({
      where: { roomId },
    });
  }
}