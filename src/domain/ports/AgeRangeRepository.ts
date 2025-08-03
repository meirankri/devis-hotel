import { AgeRange } from '../entities/AgeRange';

export interface AgeRangeRepository {
  findById(id: string): Promise<AgeRange | null>;
  findAll(): Promise<AgeRange[]>;
  save(ageRange: Omit<AgeRange, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgeRange>;
  update(id: string, ageRange: Partial<AgeRange>): Promise<AgeRange>;
  delete(id: string): Promise<void>;
}