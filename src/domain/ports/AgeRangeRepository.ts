import { AgeRange } from '../entities/AgeRange';

export interface AgeRangeRepository {
  findById(id: string, organizationId: string): Promise<AgeRange | null>;
  findAllByOrganization(organizationId: string): Promise<AgeRange[]>;
  save(ageRange: Omit<AgeRange, 'id' | 'createdAt' | 'updatedAt'>, organizationId: string): Promise<AgeRange>;
  update(id: string, ageRange: Partial<AgeRange>, organizationId: string): Promise<AgeRange>;
  delete(id: string, organizationId: string): Promise<void>;
}