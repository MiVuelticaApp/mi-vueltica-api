import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";
import { IModerationVoteRepository } from "@/domain/moderation/repositories/IModerationVoteRepository";
import { ModerationTarget, StoredVote } from "@/domain/moderation/entities/ModerationVote";
import { VoteChoice, moderationVoteWeight, moderatorLevel } from "@/domain/moderation/moderationRules";
import { reputationCause } from "@/domain/reputation/entities/ReputationEvent";
import { UserRole } from "@/domain/users/entities/User";
import { ReputationLedger } from "@/application/reputation/services/ReputationLedger";
import { TransactionOptions } from "@/domain/core/transactions/TransactionOptions";

/** The caller of a moderation route; the role comes from the database (`requireRole`), never the client. */
export interface Voter {
  id: string;
  role: UserRole;
}

/**
 * Every vote / undo runs in READ COMMITTED: it locks the item's vote rows, and under REPEATABLE READ
 * those locks cover index gaps, so votes on two different items at once deadlocked (tested).
 */
export const VOTE_TRANSACTION: TransactionOptions = { readCommitted: true };

export const MODERATION_LEVEL_ERROR = "Necesitas nivel 3 para moderar";

/**
 * Locks every user whose points may change, in id order (so two transactions never wait on each other
 * in opposite orders). Returns their points; users that no longer exist are left out.
 */
export async function lockUsersInOrder(reputation: IReputationRepository, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))].sort();
  const points = new Map<string, number>();
  for (const id of unique) {
    const value = await reputation.lockPoints(id);
    if (value !== null) points.set(id, value);
  }
  return points;
}

/**
 * Casts or changes the voter's vote (weight from their current level) and gives +1 the first time.
 * The target and the voter must already be locked.
 */
export async function castVote(
  votes: IModerationVoteRepository,
  reputation: IReputationRepository,
  target: ModerationTarget,
  voter: { id: string; role: UserRole },
  voterPoints: number,
  choice: VoteChoice,
  now: Date,
): Promise<StoredVote> {
  const weight = moderationVoteWeight(moderatorLevel(voter.role, voterPoints));
  const vote = await votes.save(target, voter.id, choice, weight, now);
  // The key is the vote row: changing the choice keeps the row, so it gives no extra point.
  await ReputationLedger.award(reputation, {
    userId: voter.id,
    kind: "moderationVote",
    causeKey: reputationCause.moderationVote(vote.id),
    at: now,
  });
  return vote;
}

/** Removes the voter's vote and its point (no-op without a vote). */
export async function withdrawVote(
  votes: IModerationVoteRepository,
  reputation: IReputationRepository,
  target: ModerationTarget,
  voterId: string,
): Promise<void> {
  const removed = await votes.remove(target, voterId);
  if (removed) await ReputationLedger.revoke(reputation, voterId, reputationCause.moderationVote(removed.id));
}

/** −2 for every vote on the losing side of a decided item (nobody on a tie). Voters must be locked. */
export async function penalizeMinority(
  reputation: IReputationRepository,
  votes: StoredVote[],
  losing: VoteChoice | null,
  now: Date,
): Promise<void> {
  if (!losing) return;
  for (const vote of votes) {
    if (vote.choice !== losing) continue;
    await ReputationLedger.award(reputation, {
      userId: vote.userId,
      kind: "minorityModerator",
      causeKey: reputationCause.moderationMinority(vote.id),
      at: now,
    });
  }
}
