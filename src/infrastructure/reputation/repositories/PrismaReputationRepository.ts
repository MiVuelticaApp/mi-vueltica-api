import { randomUUID } from "crypto";
import {
  IReputationRepository,
  NewReputationEntry,
  ReputationEntry,
} from "@/domain/reputation/repositories/IReputationRepository";
import { ReputationEvent } from "@/domain/reputation/entities/ReputationEvent";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { reputationKindFromDb, reputationKindToDb } from "../mappers/reputationEnums";

/** Writes must run on a transaction client: `lockPoints` holds the user row until the transaction ends. */
export default class PrismaReputationRepository implements IReputationRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async lockPoints(userId: string): Promise<number | null> {
    try {
      const rows = await this.client.$queryRaw<{ reputationPoints: number }[]>`
        SELECT reputationPoints FROM User WHERE id = ${userId} FOR UPDATE
      `;
      return rows.length === 0 ? null : Number(rows[0].reputationPoints);
    } catch (error) {
      console.error("Error locking user points:", error);
      throw new DatabaseError("Could not lock the user's points", error);
    }
  }

  async findByCause(causeKey: string): Promise<ReputationEntry | null> {
    try {
      return await this.client.reputationEvent.findUnique({ where: { causeKey }, select: { userId: true, delta: true } });
    } catch (error) {
      console.error("Error finding reputation event:", error);
      throw new DatabaseError("Could not read the reputation history", error);
    }
  }

  async add(entry: NewReputationEntry): Promise<void> {
    try {
      await this.client.reputationEvent.create({
        data: {
          id: randomUUID(),
          userId: entry.userId,
          kind: reputationKindToDb(entry.kind),
          delta: entry.delta,
          causeKey: entry.causeKey,
          createdAt: entry.createdAt,
        },
      });
      // `increment` is a single `SET reputationPoints = reputationPoints + ?`, and the row is locked.
      await this.client.user.update({ where: { id: entry.userId }, data: { reputationPoints: { increment: entry.delta } } });
    } catch (error) {
      console.error("Error adding reputation event:", error);
      throw new DatabaseInsertError("Could not update the reputation", error);
    }
  }

  async remove(causeKey: string, userId: string, totalChange: number): Promise<void> {
    try {
      await this.client.reputationEvent.deleteMany({ where: { causeKey } });
      await this.client.user.update({ where: { id: userId }, data: { reputationPoints: { increment: totalChange } } });
    } catch (error) {
      console.error("Error removing reputation event:", error);
      throw new DatabaseError("Could not update the reputation", error);
    }
  }

  async recent(userId: string, limit: number): Promise<ReputationEvent[]> {
    try {
      const rows = await this.client.reputationEvent.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
        select: { kind: true, delta: true, createdAt: true },
      });
      return rows.map((row) => ({ kind: reputationKindFromDb(row.kind), delta: row.delta, createdAt: row.createdAt }));
    } catch (error) {
      console.error("Error listing reputation events:", error);
      throw new DatabaseError("Could not read the reputation history", error);
    }
  }
}
