import {
  IVerificationRepository,
  SaveVerificationData,
} from "@/domain/community/repositories/ICommunityRepositories";
import { CountingVerification, VerificationSummary } from "@/domain/community/entities/Verification";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import {
  pricePaidFromDb,
  pricePaidToDb,
  stillHappeningFromDb,
  stillHappeningToDb,
  targetColumns,
} from "../mappers/communityEnums";

export default class PrismaVerificationRepository implements IVerificationRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async save(data: SaveVerificationData): Promise<void> {
    const answer = {
      userId: data.userId,
      stillHappening: stillHappeningToDb(data.stillHappening),
      pricePaid: pricePaidToDb(data.pricePaid),
      scheduleCorrect: data.scheduleCorrect,
      correctedTime: data.correctedTime,
      uploadId: data.photo?.uploadId ?? null,
      photoUrl: data.photo?.url ?? null,
      // A replaced answer counts again towards the next outcome.
      consumedAt: null,
      updatedAt: data.now,
    };
    try {
      // Runs after the plan row is locked (CommunityService), so two answers for the same plan never
      // race here and Prisma's read-then-write upsert is safe.
      if (data.target.type === "PLACE") {
        await this.client.verification.upsert({
          where: { placeId_personKey: { placeId: data.target.id, personKey: data.personKey } },
          create: { ...answer, placeId: data.target.id, personKey: data.personKey, createdAt: data.now },
          update: answer,
        });
      } else {
        await this.client.verification.upsert({
          where: { eventId_personKey: { eventId: data.target.id, personKey: data.personKey } },
          create: { ...answer, eventId: data.target.id, personKey: data.personKey, createdAt: data.now },
          update: answer,
        });
      }
    } catch (error) {
      console.error("Error saving verification:", error);
      throw new DatabaseInsertError("Could not save the verification", error);
    }
  }

  async listCounting(target: PlanTarget): Promise<CountingVerification[]> {
    try {
      const rows = await this.client.verification.findMany({
        where: { ...targetColumns(target), consumedAt: null },
        select: { stillHappening: true, pricePaid: true, userId: true, user: { select: { reputationPoints: true } } },
      });
      return rows.map((row) => ({
        stillHappening: stillHappeningFromDb(row.stillHappening),
        pricePaid: pricePaidFromDb(row.pricePaid),
        userId: row.userId,
        userPoints: row.user?.reputationPoints ?? null,
      }));
    } catch (error) {
      console.error("Error listing verifications:", error);
      throw new DatabaseError("Could not list verifications", error);
    }
  }

  async consumeAll(target: PlanTarget, at: Date): Promise<void> {
    try {
      await this.client.verification.updateMany({
        where: { ...targetColumns(target), consumedAt: null },
        data: { consumedAt: at },
      });
    } catch (error) {
      console.error("Error consuming verifications:", error);
      throw new DatabaseInsertError("Could not update verifications", error);
    }
  }

  async summary(target: PlanTarget, personKey: string | null, todayStart: Date): Promise<VerificationSummary> {
    try {
      const where = targetColumns(target);
      const [aggregate, mineToday] = await Promise.all([
        this.client.verification.aggregate({ where, _count: { _all: true }, _max: { updatedAt: true } }),
        personKey
          ? this.client.verification.count({ where: { ...where, personKey, updatedAt: { gte: todayStart } } })
          : Promise.resolve(0),
      ]);
      return {
        lastVerifiedAt: aggregate._max.updatedAt ?? null,
        verificationCount: aggregate._count._all,
        myVerifiedToday: mineToday > 0,
      };
    } catch (error) {
      console.error("Error summarizing verifications:", error);
      throw new DatabaseError("Could not summarize verifications", error);
    }
  }
}
