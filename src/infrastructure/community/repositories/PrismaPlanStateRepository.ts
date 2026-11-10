import { IPlanStateRepository } from "@/domain/community/repositories/ICommunityRepositories";
import { PlanState } from "@/domain/community/entities/PlanState";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

interface StateRow {
  status: PlanState["status"];
  pricePerPerson: number | null;
  hiddenReason: string | null;
  reportedAt: Date | null;
  authorId: string | null;
}

/** Must run on a transaction client: `lock` holds the row until the transaction ends. */
export default class PrismaPlanStateRepository implements IPlanStateRepository {
  constructor(private readonly client: Prisma.TransactionClient) {}

  async lock(target: PlanTarget): Promise<PlanState | null> {
    try {
      // The state comes from the locking read itself (always the latest committed values). It is not a
      // plain read, so it does not take the transaction's snapshot: the caller can still lock users
      // afterwards without MariaDB's "Record has changed since last read" (see ReputationLedger).
      const rows =
        target.type === "PLACE"
          ? await this.client.$queryRaw<StateRow[]>`
              SELECT status, pricePerPerson, hiddenReason, reportedAt, authorId FROM Place WHERE id = ${target.id} FOR UPDATE`
          : await this.client.$queryRaw<StateRow[]>`
              SELECT status, pricePerPerson, hiddenReason, reportedAt, authorId FROM Event WHERE id = ${target.id} FOR UPDATE`;
      const row = rows[0];
      if (!row) return null;
      return {
        target,
        status: row.status,
        pricePerPerson: row.pricePerPerson === null ? null : Number(row.pricePerPerson),
        hiddenReason: row.hiddenReason,
        reportedAt: row.reportedAt === null ? null : new Date(row.reportedAt),
        authorId: row.authorId,
      };
    } catch (error) {
      console.error("Error locking plan:", error);
      throw new DatabaseError("Could not lock the place / event", error);
    }
  }

  async hide(target: PlanTarget, reason: string, reportedAt: Date | null): Promise<void> {
    await this.write(target, { status: "ARCHIVED", hiddenReason: reason, reportedAt });
  }

  async publish(target: PlanTarget): Promise<void> {
    await this.write(target, { status: "PUBLISHED", hiddenReason: null, reportedAt: null });
  }

  async setPrice(target: PlanTarget, pricePerPerson: number): Promise<void> {
    await this.write(target, { pricePerPerson });
  }

  async markVerified(target: PlanTarget, at: Date): Promise<void> {
    if (target.type !== "PLACE") return;
    try {
      await this.client.place.update({ where: { id: target.id }, data: { verifiedAt: at } });
    } catch (error) {
      console.error("Error marking place verified:", error);
      throw new DatabaseInsertError("Could not update the place", error);
    }
  }

  private async write(
    target: PlanTarget,
    data: Prisma.PlaceUpdateInput & Prisma.EventUpdateInput,
  ): Promise<void> {
    try {
      if (target.type === "PLACE") await this.client.place.update({ where: { id: target.id }, data });
      else await this.client.event.update({ where: { id: target.id }, data });
    } catch (error) {
      console.error("Error updating plan:", error);
      throw new DatabaseInsertError("Could not update the place / event", error);
    }
  }
}
