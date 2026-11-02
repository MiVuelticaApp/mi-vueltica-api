import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { IProvinceRepository, ProvinceListOptions } from "@/domain/geography/repositories/IProvinceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaProvinceListRow, PrismaProvinceMapper } from "../mappers/PrismaProvinceMapper";

export default class PrismaProvinceRepository implements IProvinceRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, options: ProvinceListOptions = {}): Promise<PaginatedResult<ProvinceListItem>> {
    try {
      const include = options.includeCantons
        ? { cantons: { select: { id: true, name: true }, orderBy: { id: "asc" as const } } }
        : undefined;
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page): Promise<PrismaProvinceListRow[]> =>
            tx.province.findMany({ ...page, orderBy: page.orderBy ?? { id: "asc" }, include }),
          count: (tx) => tx.province.count(),
        },
        PrismaProvinceMapper.toListItem,
      );
    } catch (error) {
      console.error("Error listing provinces:", error);
      throw new DatabaseError("Could not list provinces", error);
    }
  }

  async find(id: number): Promise<Province | null> {
    try {
      const row = await this.client.province.findUnique({ where: { id } });
      return row ? PrismaProvinceMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding province:", error);
      throw new DatabaseError("Could not find province", error);
    }
  }

  async findByName(name: string): Promise<Province | null> {
    try {
      const row = await this.client.province.findUnique({ where: { name } });
      return row ? PrismaProvinceMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding province by name:", error);
      throw new DatabaseError("Could not find province", error);
    }
  }

  async create(province: Province): Promise<Province> {
    try {
      const row = await this.client.province.create({ data: { id: province.id, name: province.name } });
      return PrismaProvinceMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating province:", error);
      throw new DatabaseInsertError("Could not create province", error);
    }
  }

  async update(province: Province): Promise<void> {
    try {
      await this.client.province.update({ where: { id: province.id }, data: { name: province.name } });
    } catch (error) {
      console.error("Error updating province:", error);
      throw new DatabaseInsertError("Could not update province", error);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.client.province.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting province:", error);
      throw new DatabaseInsertError("Could not delete province", error);
    }
  }

  async countCantons(id: number): Promise<number> {
    try {
      return await this.client.canton.count({ where: { provinceId: id } });
    } catch (error) {
      console.error("Error counting province cantons:", error);
      throw new DatabaseError("Could not check province cantons", error);
    }
  }
}
