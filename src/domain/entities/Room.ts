export class Room {
  constructor(
    public readonly id: string,
    public readonly hotelId: string,
    public name: string,
    public description: string | null,
    public capacity: number,
    public imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    hotelId: string;
    name: string;
    description?: string;
    capacity: number;
    imageUrl?: string;
  }): Omit<Room, 'id' | 'createdAt' | 'updatedAt'> {
    if (params.capacity <= 0) {
      throw new Error('La capacité doit être supérieure à 0');
    }

    return {
      hotelId: params.hotelId,
      name: params.name,
      description: params.description ?? null,
      capacity: params.capacity,
      imageUrl: params.imageUrl ?? null,
    };
  }

  update(params: Partial<{
    name: string;
    description: string | null;
    capacity: number;
    imageUrl: string | null;
  }>): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.description !== undefined) this.description = params.description;
    if (params.capacity !== undefined) {
      if (params.capacity <= 0) {
        throw new Error('La capacité doit être supérieure à 0');
      }
      this.capacity = params.capacity;
    }
    if (params.imageUrl !== undefined) this.imageUrl = params.imageUrl;
  }
}