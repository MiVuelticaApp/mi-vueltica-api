import { Category } from "@/domain/categories/entities/Category";
import { IUserInterestRepository } from "@/domain/users/repositories/IUserInterestRepository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma, PrismaClient } from "@/infrastructure/prisma/generated/prisma/client";
import { PrismaCategoryMapper } from "@/infrastructure/categories/mappers/PrismaCategoryMapper";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaUserInterestMapper } from "../mappers/PrismaUserInterestMapper";

export default class PrismaUserInterestRepository implements IUserInterestRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listCategoriesByUser(userId: string): Promise<Category[]> {
    try {
      const rows = await this.client.category.findMany({
        where: { interests: { some: { userId } } },
        orderBy: { name: "asc" },
      });
      return rows.map(PrismaCategoryMapper.toDomain);
    } catch (error) {
      console.error("Error listing user interests:", error);
      throw new DatabaseError("Could not list user interests", error);
    }
  }

  async replaceForUser(userId: string, categoryIds: number[]): Promise<void> {
    const execute = async (tx: Prisma.TransactionClient) => {
      await tx.userInterest.deleteMany({ where: { userId } });
      if (categoryIds.length > 0) {
        await tx.userInterest.createMany({ data: PrismaUserInterestMapper.toCreateMany(userId, categoryIds) });
      }
    };
    try {
      // Root client: open a transaction. Already inside a transaction: run directly.
      const client = this.client as PrismaClient | Prisma.TransactionClient;
      if ("$transaction" in client) {
        await client.$transaction((tx) => execute(tx));
      } else {
        await execute(client);
      }
    } catch (error) {
      console.error("Error replacing user interests:", error);
      throw new DatabaseInsertError("Could not update user interests", error);
    }
  }
}
