import { Category } from "@/domain/categories/entities/Category";

export interface IUserInterestRepository {
  /** Categories the user is interested in, ordered by name. */
  listCategoriesByUser(userId: string): Promise<Category[]>;
  /** Atomically replaces the whole interest set of the user. */
  replaceForUser(userId: string, categoryIds: number[]): Promise<void>;
}
