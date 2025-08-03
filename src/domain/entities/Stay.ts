export class Stay {
  constructor(
    public readonly id: string,
    public name: string,
    public slug: string,
    public description: string | null,
    public startDate: Date,
    public endDate: Date,
    public hotelId: string,
    public allowPartialBooking: boolean,
    public minDays: number | null,
    public maxDays: number | null,
    public isActive: boolean,
    public imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    name: string;
    slug: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    hotelId: string;
    allowPartialBooking?: boolean;
    minDays?: number;
    maxDays?: number;
    isActive?: boolean;
    imageUrl?: string;
  }): Omit<Stay, 'id' | 'createdAt' | 'updatedAt'> {
    if (params.startDate >= params.endDate) {
      throw new Error('La date de début doit être avant la date de fin');
    }

    if (params.minDays && params.maxDays && params.minDays > params.maxDays) {
      throw new Error('Le nombre minimum de jours ne peut pas être supérieur au maximum');
    }

    const totalDays = Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (params.minDays && params.minDays > totalDays) {
      throw new Error('Le nombre minimum de jours ne peut pas dépasser la durée totale du séjour');
    }

    return {
      name: params.name,
      slug: params.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: params.description ?? null,
      startDate: params.startDate,
      endDate: params.endDate,
      hotelId: params.hotelId,
      allowPartialBooking: params.allowPartialBooking ?? false,
      minDays: params.minDays ?? null,
      maxDays: params.maxDays ?? null,
      isActive: params.isActive ?? true,
      imageUrl: params.imageUrl ?? null,
      update: function() {
        throw new Error('Cannot update an unsaved Stay');
      },
      getDuration: function() {
        return Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    };
  }

  update(params: Partial<{
    name: string;
    slug: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    hotelId: string;
    allowPartialBooking: boolean;
    minDays: number | null;
    maxDays: number | null;
    isActive: boolean;
    imageUrl: string | null;
  }>): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.slug !== undefined) this.slug = params.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (params.description !== undefined) this.description = params.description;
    if (params.hotelId !== undefined) this.hotelId = params.hotelId;
    if (params.allowPartialBooking !== undefined) this.allowPartialBooking = params.allowPartialBooking;
    if (params.isActive !== undefined) this.isActive = params.isActive;
    if (params.imageUrl !== undefined) this.imageUrl = params.imageUrl;

    const newStartDate = params.startDate ?? this.startDate;
    const newEndDate = params.endDate ?? this.endDate;
    const newMinDays = params.minDays !== undefined ? params.minDays : this.minDays;
    const newMaxDays = params.maxDays !== undefined ? params.maxDays : this.maxDays;

    if (newStartDate >= newEndDate) {
      throw new Error('La date de début doit être avant la date de fin');
    }

    if (newMinDays && newMaxDays && newMinDays > newMaxDays) {
      throw new Error('Le nombre minimum de jours ne peut pas être supérieur au maximum');
    }

    const totalDays = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (newMinDays && newMinDays > totalDays) {
      throw new Error('Le nombre minimum de jours ne peut pas dépasser la durée totale du séjour');
    }

    if (params.startDate !== undefined) this.startDate = params.startDate;
    if (params.endDate !== undefined) this.endDate = params.endDate;
    if (params.minDays !== undefined) this.minDays = params.minDays;
    if (params.maxDays !== undefined) this.maxDays = params.maxDays;
  }

  getDuration(): number {
    return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}