import { Category } from "@/domain/categories/entities/Category";
import { CategoryName } from "@/domain/categories/valueObjects/categoryName.valueObject";
import { CategoryListFilters, ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { ICategoryService } from "../interfaces/ICategoryService";
import { CategoryNotFoundError } from "../../errors/CategoryNotFoundError";
import { CategoryAlreadyExistsError } from "../../errors/CategoryAlreadyExistsError";
import { CategoryInUseError } from "../../errors/CategoryInUseError";

export class CategoryService implements ICategoryService {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async list(params: PaginationParams, filters?: CategoryListFilters): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.list(params, filters);
  }

  async get(id: number): Promise<Category> {
    const category = await this.categoryRepository.find(id);
    if (!category) throw new CategoryNotFoundError();
    return category;
  }

  async create(name: string): Promise<Category> {
    const normalized = CategoryName.create(name).value;
    const existing = await this.categoryRepository.findByName(normalized);
    if (existing) throw new CategoryAlreadyExistsError();
    return this.categoryRepository.create(normalized);
  }

  async update(id: number, name: string): Promise<Category> {
    const category = await this.get(id);
    category.rename(name);

    const existing = await this.categoryRepository.findByName(category.name);
    if (existing && existing.id !== id) throw new CategoryAlreadyExistsError();

    await this.categoryRepository.update(category);
    return this.get(id);
  }

  async delete(id: number): Promise<void> {
    await this.get(id);
    const usage = await this.categoryRepository.countUsages(id);
    if (usage.places > 0 || usage.events > 0) throw new CategoryInUseError();
    // User interests are removed by the ON DELETE CASCADE foreign key.
    await this.categoryRepository.delete(id);
  }
}
