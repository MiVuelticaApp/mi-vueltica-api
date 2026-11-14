import { randomUUID } from "crypto";
import { BlockedUser } from "@/domain/blocks/entities/BlockedUser";
import { IBlockRepository } from "@/domain/blocks/repositories/IBlockRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

export default class PrismaBlockRepository implements IBlockRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  /**
   * One `INSERT ... ON DUPLICATE KEY UPDATE` on the `(blockerId, blockedId)` unique index, like favorites: a
   * repeated or concurrent block never fails with P2002 and keeps its original `createdAt`. Not `INSERT IGNORE`,
   * which would hide foreign key errors. The id and `createdAt` are set here because Prisma's defaults only apply
   * to Prisma writes.
   */
  async add(blockerId: string, blockedId: string): Promise<void> {
    try {
      await this.client.$executeRaw`
        INSERT INTO UserBlock (id, blockerId, blockedId, createdAt)
        VALUES (${randomUUID()}, ${blockerId}, ${blockedId}, UTC_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE id = id
      `;
    } catch (error) {
      console.error("Error adding block:", error);
      throw new DatabaseInsertError("Could not block the user", error);
    }
  }

  async remove(blockerId: string, blockId: string): Promise<void> {
    try {
      await this.client.userBlock.deleteMany({ where: { id: blockId, blockerId } });
    } catch (error) {
      console.error("Error removing block:", error);
      throw new DatabaseError("Could not unblock the user", error);
    }
  }

  async listForUser(blockerId: string, params: PaginationParams): Promise<PaginatedResult<BlockedUser>> {
    try {
      const where: Prisma.UserBlockWhereInput = { blockerId };
      // Most recently blocked first unless a direction is given; `id` keeps pages stable.
      const direction = params.sort?.direction ?? "desc";
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.userBlock.findMany({
              where,
              include: { blocked: { select: { name: true } } },
              skip: page.skip,
              take: page.take,
              orderBy: [{ createdAt: direction }, { id: "asc" }],
            }),
          count: (tx) => tx.userBlock.count({ where }),
        },
        (row): BlockedUser => ({ id: row.id, name: row.blocked.name, createdAt: row.createdAt }),
      );
    } catch (error) {
      console.error("Error listing blocks:", error);
      throw new DatabaseError("Could not list blocked users", error);
    }
  }

  async blockedUserIds(blockerId: string): Promise<string[]> {
    try {
      const rows = await this.client.userBlock.findMany({ where: { blockerId }, select: { blockedId: true } });
      return rows.map((row) => row.blockedId);
    } catch (error) {
      console.error("Error reading blocked users:", error);
      throw new DatabaseError("Could not read blocked users", error);
    }
  }
}
