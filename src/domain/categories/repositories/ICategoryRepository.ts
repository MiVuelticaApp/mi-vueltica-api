import { Category } from "@/domain/categories/entities/Category";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface CategoryListFilters {
  search?: string;
}

export interface CategoryUsage {
  places: number;
  events: number;
}

export interface ICategoryRepository {
  list(params: PaginationParams, filters?: CategoryListFilters): Promise<PaginatedResult<Category>>;
  find(id: number): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findByIds(ids: number[]): Promise<Category[]>;
  create(name: string): Promise<Category>;
  update(category: Category): Promise<void>;
  delete(id: number): Promise<void>;
  countUsages(id: number): Promise<CategoryUsage>;
}
