import { PrismaClient } from '@prisma/client';
import { AgeRange } from '@/domain/entities/AgeRange';
import { AgeRangeRepository } from '@/domain/ports/AgeRangeRepository';

export class PrismaAgeRangeRepository implements AgeRangeRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<AgeRange | null> {
    const ageRange = await this.prisma.ageRange.findFirst({
      where: { id, organizationId },
    });

    if (!ageRange) return null;

    return new AgeRange(
      ageRange.id,
      ageRange.name,
      ageRange.minAge,
      ageRange.maxAge,
      ageRange.order,
      ageRange.createdAt,
      ageRange.updatedAt
    );
  }

  async findAllByOrganization(organizationId: string): Promise<AgeRange[]> {
    const ageRanges = await this.prisma.ageRange.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });

    return ageRanges.map(
      ageRange =>
        new AgeRange(
          ageRange.id,
          ageRange.name,
          ageRange.minAge,
          ageRange.maxAge,
          ageRange.order,
          ageRange.createdAt,
          ageRange.updatedAt
        )
    );
  }

  async save(ageRange: Omit<AgeRange, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<AgeRange> {
    const created = await this.prisma.ageRange.create({
      data: {
        name: ageRange.name,
        minAge: ageRange.minAge,
        maxAge: ageRange.maxAge,
        order: ageRange.order,
        organizationId,
      },
    });

    return new AgeRange(
      created.id,
      created.name,
      created.minAge,
      created.maxAge,
      created.order,
      created.createdAt,
      created.updatedAt
    );
  }

  async update(id: string, ageRange: Partial<AgeRange>, organizationId: string): Promise<AgeRange> {
    const updated = await this.prisma.ageRange.update({
      where: { id, organizationId },
      data: {
        name: ageRange.name,
        minAge: ageRange.minAge,
        maxAge: ageRange.maxAge,
        order: ageRange.order,
      },
    });

    return new AgeRange(
      updated.id,
      updated.name,
      updated.minAge,
      updated.maxAge,
      updated.order,
      updated.createdAt,
      updated.updatedAt
    );
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.ageRange.deleteMany({
      where: { id, organizationId },
    });
  }
}