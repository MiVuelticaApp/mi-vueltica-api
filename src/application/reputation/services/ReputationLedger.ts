import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";
import { REPUTATION_POINTS, ReputationKind, appliedDelta } from "@/domain/reputation/reputationRules";

export interface ReputationAward {
  userId: string;
  kind: ReputationKind;
  /** Unique per cause (see `reputationCause`): the same cause never changes the points twice. */
  causeKey: string;
  at: Date;
}

/**
 * Writes reputation changes. Always call it with a repository bound to the caller's transaction, so
 * the points are written (or rolled back) together with what caused them.
 *
 * Each call locks the user row first: concurrent changes for the same user run one after the other,
 * so the floor is computed on the real total and a repeated cause is always seen.
 *
 * Lock order: when the transaction also inserts rows that reference the user (a verification, a
 * Place/Event with `authorId`), call `repository.lockPoints(userId)` BEFORE those inserts. Their
 * foreign key check takes a shared lock on the user row, and two transactions holding it and then
 * asking for the exclusive one deadlock (MySQL / MariaDB error 1213). Also lock it before the
 * transaction's first plain read: MariaDB's snapshot isolation fails a later lock with error 1020 if
 * another transaction changed the points after that read. Lock order is always plan / submission
 * first, then users (two users in id order).
 */
export const ReputationLedger = {
  /** Applies the kind's points. Returns the points actually applied (0 if already applied or the user is gone). */
  async award(repository: IReputationRepository, { userId, kind, causeKey, at }: ReputationAward): Promise<number> {
    const points = await repository.lockPoints(userId);
    if (points === null) return 0;
    if (await repository.findByCause(causeKey)) return 0;
    const delta = appliedDelta(points, REPUTATION_POINTS[kind]);
    await repository.add({ userId, kind, delta, causeKey, createdAt: at });
    return delta;
  },

  /** Undoes a previous award (e.g. an "útil" vote taken back). No-op when there is none. */
  async revoke(repository: IReputationRepository, userId: string, causeKey: string): Promise<void> {
    const points = await repository.lockPoints(userId);
    if (points === null) return;
    const entry = await repository.findByCause(causeKey);
    if (!entry) return;
    await repository.remove(causeKey, entry.userId, appliedDelta(points, -entry.delta));
  },
};
