import { Category } from "@/domain/categories/entities/Category";
import { CategoryListFilters } from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface ICategoryService {
  list(params: PaginationParams, filters?: CategoryListFilters): Promise<PaginatedResult<Category>>;
  get(id: number): Promise<Category>;
  create(name: string): Promise<Category>;
  update(id: number, name: string): Promise<Category>;
  delete(id: number): Promise<void>;
}
