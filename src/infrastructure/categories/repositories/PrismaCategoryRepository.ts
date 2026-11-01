import { Category } from "@/domain/categories/entities/Category";
import {
  CategoryListFilters,
  CategoryUsage,
  ICategoryRepository,
} from "@/domain/categories/repositories/ICategoryRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaCategoryMapper } from "../mappers/PrismaCategoryMapper";

export default class PrismaCategoryRepository implements ICategoryRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: CategoryListFilters = {}): Promise<PaginatedResult<Category>> {
    try {
      const where: Prisma.CategoryWhereInput = filters.search
        ? { name: { contains: filters.search } }
        : {};
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.category.findMany({ where, ...page, orderBy: page.orderBy ?? { name: "asc" } }),
          count: (tx) => tx.category.count({ where }),
        },
        PrismaCategoryMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing categories:", error);
      throw new DatabaseError("Could not list categories", error);
    }
  }

  async find(id: number): Promise<Category | null> {
    try {
      const row = await this.client.category.findUnique({ where: { id } });
      return row ? PrismaCategoryMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding category:", error);
      throw new DatabaseError("Could not find category", error);
    }
  }

  async findByName(name: string): Promise<Category | null> {
    try {
      const row = await this.client.category.findUnique({ where: { name } });
      return row ? PrismaCategoryMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding category by name:", error);
      throw new DatabaseError("Could not find category", error);
    }
  }

  async findByIds(ids: number[]): Promise<Category[]> {
    try {
      if (ids.length === 0) return [];
      const rows = await this.client.category.findMany({ where: { id: { in: ids } } });
      return rows.map(PrismaCategoryMapper.toDomain);
    } catch (error) {
      console.error("Error finding categories by ids:", error);
      throw new DatabaseError("Could not find categories", error);
    }
  }

  async create(name: string): Promise<Category> {
    try {
      const row = await this.client.category.create({ data: { name } });
      return PrismaCategoryMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating category:", error);
      throw new DatabaseInsertError("Could not create category", error);
    }
  }

  async update(category: Category): Promise<void> {
    try {
      await this.client.category.update({ where: { id: category.id }, data: { name: category.name } });
    } catch (error) {
      console.error("Error updating category:", error);
      throw new DatabaseInsertError("Could not update category", error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.client.category.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new DatabaseInsertError("Could not delete category", error);
    }
  }

  async countUsages(id: number): Promise<CategoryUsage> {
    try {
      const [places, events] = await Promise.all([
        this.client.place.count({ where: { categoryId: id } }),
        this.client.event.count({ where: { categoryId: id } }),
      ]);
      return { places, events };
    } catch (error) {
      console.error("Error counting category usages:", error);
      throw new DatabaseError("Could not check category usage", error);
    }
  }
}
