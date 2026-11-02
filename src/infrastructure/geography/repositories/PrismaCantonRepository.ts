import { Canton } from "@/domain/geography/entities/Canton";
import { ICantonRepository } from "@/domain/geography/repositories/ICantonRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaCantonMapper } from "../mappers/PrismaCantonMapper";

export default class PrismaCantonRepository implements ICantonRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listByProvince(provinceId: number, params: PaginationParams): Promise<PaginatedResult<Canton>> {
    try {
      const where: Prisma.CantonWhereInput = { provinceId };
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.canton.findMany({ where, ...page, orderBy: page.orderBy ?? { id: "asc" } }),
          count: (tx) => tx.canton.count({ where }),
        },
        PrismaCantonMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing cantons:", error);
      throw new DatabaseError("Could not list cantons", error);
    }
  }

  async find(id: number): Promise<Canton | null> {
    try {
      const row = await this.client.canton.findUnique({ where: { id } });
      return row ? PrismaCantonMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding canton:", error);
      throw new DatabaseError("Could not find canton", error);
    }
  }

  async findByName(provinceId: number, name: string): Promise<Canton | null> {
    try {
      // Composite unique key (provinceId, name); the column collation makes it case- and
      // accent-insensitive, like the DB constraint itself.
      const row = await this.client.canton.findUnique({ where: { provinceId_name: { provinceId, name } } });
      return row ? PrismaCantonMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding canton by name:", error);
      throw new DatabaseError("Could not find canton", error);
    }
  }

  async create(canton: Canton): Promise<Canton> {
    try {
      const row = await this.client.canton.create({
        data: { id: canton.id, provinceId: canton.provinceId, name: canton.name },
      });
      return PrismaCantonMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating canton:", error);
      throw new DatabaseInsertError("Could not create canton", error);
    }
  }

  async update(canton: Canton): Promise<void> {
    try {
      // Only the name: the id (and so the province) is immutable.
      await this.client.canton.update({ where: { id: canton.id }, data: { name: canton.name } });
    } catch (error) {
      console.error("Error updating canton:", error);
      throw new DatabaseInsertError("Could not update canton", error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.client.canton.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting canton:", error);
      throw new DatabaseInsertError("Could not delete canton", error);
    }
  }

  async countPlaces(id: number): Promise<number> {
    try {
      return await this.client.place.count({ where: { cantonId: id } });
    } catch (error) {
      console.error("Error counting canton places:", error);
      throw new DatabaseError("Could not check canton places", error);
    }
  }
}
