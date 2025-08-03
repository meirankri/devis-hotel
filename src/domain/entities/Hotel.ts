export class Hotel {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public address: string | null,
    public imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    name: string;
    description?: string;
    address?: string;
    imageUrl?: string;
  }): Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: params.name,
      description: params.description ?? null,
      address: params.address ?? null,
      imageUrl: params.imageUrl ?? null,
      update: function() {
        throw new Error('Cannot update an unsaved Hotel');
      }
    };
  }

  update(params: Partial<{
    name: string;
    description: string | null;
    address: string | null;
    imageUrl: string | null;
  }>): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.description !== undefined) this.description = params.description;
    if (params.address !== undefined) this.address = params.address;
    if (params.imageUrl !== undefined) this.imageUrl = params.imageUrl;
  }
}