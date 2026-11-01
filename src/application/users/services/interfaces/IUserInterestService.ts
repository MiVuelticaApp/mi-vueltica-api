import { Category } from "@/domain/categories/entities/Category";

export interface IUserInterestService {
  list(userId: string): Promise<Category[]>;
  replace(userId: string, categoryIds: number[]): Promise<Category[]>;
}
