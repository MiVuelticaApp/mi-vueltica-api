import { randomUUID } from "crypto";
import { IModerationVoteRepository } from "@/domain/moderation/repositories/IModerationVoteRepository";
import { ModerationTarget, StoredVote, moderationTargetKey } from "@/domain/moderation/entities/ModerationVote";
import { VoteChoice, VoteTally } from "@/domain/moderation/moderationRules";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma, VoteChoice as DbVoteChoice } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

const CHOICE_TO_DB: Record<VoteChoice, DbVoteChoice> = { for: "FOR", against: "AGAINST" };
const choiceFromDb = (choice: DbVoteChoice): VoteChoice => (choice === "FOR" ? "for" : "against");

/** The one id column a target uses (exactly one is set per row). */
function targetColumn(target: ModerationTarget): { submissionId: string } | { placeId: string } | { eventId: string } {
  switch (target.type) {
    case "SUBMISSION":
      return { submissionId: target.id };
    case "PLACE":
      return { placeId: target.id };
    case "EVENT":
      return { eventId: target.id };
  }
}

const VOTE_SELECT = { id: true, userId: true, choice: true, weight: true } as const;
const toVote = (row: { id: string; userId: string; choice: DbVoteChoice; weight: number }): StoredVote => ({
  id: row.id,
  userId: row.userId,
  choice: choiceFromDb(row.choice),
  weight: row.weight,
});

/** Writes must run on a transaction client after locking the target (see the units of work). */
export default class PrismaModerationVoteRepository implements IModerationVoteRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async lockVoterIds(target: ModerationTarget): Promise<string[]> {
    try {
      // Locking read only: it does not take the transaction's snapshot (see ReputationLedger).
      const rows =
        target.type === "SUBMISSION"
          ? await this.client.$queryRaw<{ userId: string }[]>`SELECT userId FROM ModerationVote WHERE submissionId = ${target.id} FOR UPDATE`
          : target.type === "PLACE"
            ? await this.client.$queryRaw<{ userId: string }[]>`SELECT userId FROM ModerationVote WHERE placeId = ${target.id} FOR UPDATE`
            : await this.client.$queryRaw<{ userId: string }[]>`SELECT userId FROM ModerationVote WHERE eventId = ${target.id} FOR UPDATE`;
      return rows.map((row) => row.userId);
    } catch (error) {
      console.error("Error locking moderation votes:", error);
      throw new DatabaseError("Could not read the votes", error);
    }
  }

  async list(target: ModerationTarget): Promise<StoredVote[]> {
    try {
      const rows = await this.client.moderationVote.findMany({
        where: targetColumn(target),
        select: VOTE_SELECT,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      return rows.map(toVote);
    } catch (error) {
      console.error("Error listing moderation votes:", error);
      throw new DatabaseError("Could not read the votes", error);
    }
  }

  async save(target: ModerationTarget, userId: string, choice: VoteChoice, weight: number, now: Date): Promise<StoredVote> {
    try {
      // The target row is locked, so this read-then-write cannot race with another vote on it.
      const where = { ...targetColumn(target), userId };
      const existing = await this.client.moderationVote.findFirst({ where, select: { id: true } });
      const row = existing
        ? await this.client.moderationVote.update({
            where: { id: existing.id },
            data: { choice: CHOICE_TO_DB[choice], weight, updatedAt: now },
            select: VOTE_SELECT,
          })
        : await this.client.moderationVote.create({
            data: { id: randomUUID(), ...where, choice: CHOICE_TO_DB[choice], weight, createdAt: now, updatedAt: now },
            select: VOTE_SELECT,
          });
      return toVote(row);
    } catch (error) {
      console.error("Error saving moderation vote:", error);
      throw new DatabaseInsertError("Could not save the vote", error);
    }
  }

  async remove(target: ModerationTarget, userId: string): Promise<StoredVote | null> {
    try {
      const row = await this.client.moderationVote.findFirst({ where: { ...targetColumn(target), userId }, select: VOTE_SELECT });
      if (!row) return null;
      await this.client.moderationVote.delete({ where: { id: row.id } });
      return toVote(row);
    } catch (error) {
      console.error("Error removing moderation vote:", error);
      throw new DatabaseError("Could not remove the vote", error);
    }
  }

  async removeAll(target: ModerationTarget): Promise<void> {
    try {
      await this.client.moderationVote.deleteMany({ where: targetColumn(target) });
    } catch (error) {
      console.error("Error removing moderation votes:", error);
      throw new DatabaseError("Could not remove the votes", error);
    }
  }

  async tallies(targets: ModerationTarget[], viewerId: string): Promise<Map<string, VoteTally & { myVote: VoteChoice | null }>> {
    const result = new Map<string, VoteTally & { myVote: VoteChoice | null }>();
    if (targets.length === 0) return result;
    const ids = (type: ModerationTarget["type"]) => targets.filter((t) => t.type === type).map((t) => t.id);
    try {
      // One query for the whole page (never one per item).
      const rows = await this.client.moderationVote.findMany({
        where: {
          OR: [
            { submissionId: { in: ids("SUBMISSION") } },
            { placeId: { in: ids("PLACE") } },
            { eventId: { in: ids("EVENT") } },
          ],
        },
        select: { submissionId: true, placeId: true, eventId: true, userId: true, choice: true, weight: true },
      });
      for (const row of rows) {
        const target: ModerationTarget = row.submissionId
          ? { type: "SUBMISSION", id: row.submissionId }
          : row.placeId
            ? { type: "PLACE", id: row.placeId }
            : { type: "EVENT", id: row.eventId as string };
        const key = moderationTargetKey(target);
        const tally = result.get(key) ?? { votesFor: 0, votesAgainst: 0, myVote: null };
        const choice = choiceFromDb(row.choice);
        if (choice === "for") tally.votesFor += row.weight;
        else tally.votesAgainst += row.weight;
        if (row.userId === viewerId) tally.myVote = choice;
        result.set(key, tally);
      }
      return result;
    } catch (error) {
      console.error("Error counting moderation votes:", error);
      throw new DatabaseError("Could not count the votes", error);
    }
  }
}
