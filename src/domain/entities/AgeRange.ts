export class AgeRange {
  constructor(
    public readonly id: string,
    public name: string,
    public minAge: number | null,
    public maxAge: number | null,
    public order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    name: string;
    minAge?: number;
    maxAge?: number;
    order?: number;
  }): Omit<AgeRange, 'id' | 'createdAt' | 'updatedAt'> {
    if (params.minAge !== undefined && params.maxAge !== undefined) {
      if (params.minAge > params.maxAge) {
        throw new Error('L\'âge minimum ne peut pas être supérieur à l\'âge maximum');
      }
    }

    return {
      name: params.name,
      minAge: params.minAge ?? null,
      maxAge: params.maxAge ?? null,
      order: params.order ?? 0,
    };
  }

  update(params: Partial<{
    name: string;
    minAge: number | null;
    maxAge: number | null;
    order: number;
  }>): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.order !== undefined) this.order = params.order;
    
    const newMinAge = params.minAge !== undefined ? params.minAge : this.minAge;
    const newMaxAge = params.maxAge !== undefined ? params.maxAge : this.maxAge;
    
    if (newMinAge !== null && newMaxAge !== null && newMinAge > newMaxAge) {
      throw new Error('L\'âge minimum ne peut pas être supérieur à l\'âge maximum');
    }
    
    if (params.minAge !== undefined) this.minAge = params.minAge;
    if (params.maxAge !== undefined) this.maxAge = params.maxAge;
  }
}