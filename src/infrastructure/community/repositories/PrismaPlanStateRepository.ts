import { IPlanStateRepository } from "@/domain/community/repositories/ICommunityRepositories";
import { PlanState } from "@/domain/community/entities/PlanState";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

const STATE_SELECT = { status: true, pricePerPerson: true, hiddenReason: true, reportedAt: true } as const;

/** Must run on a transaction client: `lock` holds the row until the transaction ends. */
export default class PrismaPlanStateRepository implements IPlanStateRepository {
  constructor(private readonly client: Prisma.TransactionClient) {}

  async lock(target: PlanTarget): Promise<PlanState | null> {
    try {
      const locked =
        target.type === "PLACE"
          ? await this.client.$queryRaw<{ id: string }[]>`SELECT id FROM Place WHERE id = ${target.id} FOR UPDATE`
          : await this.client.$queryRaw<{ id: string }[]>`SELECT id FROM Event WHERE id = ${target.id} FOR UPDATE`;
      if (locked.length === 0) return null;
      // Read after the lock, so it sees the latest committed values.
      const row =
        target.type === "PLACE"
          ? await this.client.place.findUnique({ where: { id: target.id }, select: STATE_SELECT })
          : await this.client.event.findUnique({ where: { id: target.id }, select: STATE_SELECT });
      return row ? { target, ...row } : null;
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
