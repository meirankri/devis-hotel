import { Decimal } from '@prisma/client/runtime/library';

export class RoomPricing {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public readonly ageRangeId: string,
    public price: Decimal,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    roomId: string;
    ageRangeId: string;
    price: number;
  }): Omit<RoomPricing, 'id' | 'createdAt' | 'updatedAt'> {
    if (params.price < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }

    return {
      roomId: params.roomId,
      ageRangeId: params.ageRangeId,
      price: new Decimal(params.price),
    };
  }

  updatePrice(price: number): void {
    if (price < 0) {
      throw new Error('Le prix ne peut pas être négatif');
    }
    this.price = new Decimal(price);
  }
}