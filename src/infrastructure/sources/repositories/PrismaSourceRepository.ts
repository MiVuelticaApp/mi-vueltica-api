import { Source } from "@/domain/sources/entities/Source";
import {
  CreateSourceData,
  ISourceRepository,
  SourceListFilters,
  SourceUsage,
} from "@/domain/sources/repositories/ISourceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaSourceMapper } from "../mappers/PrismaSourceMapper";

export default class PrismaSourceRepository implements ISourceRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: SourceListFilters = {}): Promise<PaginatedResult<Source>> {
    try {
      const where: Prisma.SourceWhereInput = {
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.search ? { name: { contains: filters.search } } : {}),
      };
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.source.findMany({ where, ...page, orderBy: page.orderBy ?? { name: "asc" } }),
          count: (tx) => tx.source.count({ where }),
        },
        PrismaSourceMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing sources:", error);
      throw new DatabaseError("Could not list sources", error);
    }
  }

  async find(id: string): Promise<Source | null> {
    try {
      const row = await this.client.source.findUnique({ where: { id } });
      return row ? PrismaSourceMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding source:", error);
      throw new DatabaseError("Could not find source", error);
    }
  }

  async create(data: CreateSourceData): Promise<Source> {
    try {
      const row = await this.client.source.create({
        data: { name: data.name, url: data.url, type: data.type },
      });
      return PrismaSourceMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating source:", error);
      throw new DatabaseInsertError("Could not create source", error);
    }
  }

  async update(source: Source): Promise<void> {
    try {
      await this.client.source.update({
        where: { id: source.id },
        data: {
          name: source.name,
          url: source.url,
          type: source.type,
          lastCrawledAt: source.lastCrawledAt,
        },
      });
    } catch (error) {
      console.error("Error updating source:", error);
      throw new DatabaseInsertError("Could not update source", error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.source.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting source:", error);
      throw new DatabaseInsertError("Could not delete source", error);
    }
  }

  async countUsages(id: string): Promise<SourceUsage> {
    try {
      const [places, events] = await Promise.all([
        this.client.place.count({ where: { sourceId: id } }),
        this.client.event.count({ where: { sourceId: id } }),
      ]);
      return { places, events };
    } catch (error) {
      console.error("Error counting source usages:", error);
      throw new DatabaseError("Could not check source usage", error);
    }
  }
}
