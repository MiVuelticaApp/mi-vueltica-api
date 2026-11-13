import { VoteChoice, VoteTally } from "../moderationRules";
import { ModerationTarget, StoredVote } from "../entities/ModerationVote";

export interface IModerationVoteRepository {
  /**
   * Locks the target's votes (`SELECT ... FOR UPDATE`, no plain read) and returns who cast them, so the
   * unit of work can lock those users before the transaction's first plain read (see ReputationLedger).
   */
  lockVoterIds(target: ModerationTarget): Promise<string[]>;
  list(target: ModerationTarget): Promise<StoredVote[]>;
  /** Creates the user's vote or changes it (same id). Run after locking the target. */
  save(target: ModerationTarget, userId: string, choice: VoteChoice, weight: number, now: Date): Promise<StoredVote>;
  /** Deletes the user's vote; returns it, or null if there was none. */
  remove(target: ModerationTarget, userId: string): Promise<StoredVote | null>;
  /** Deletes every vote of a reported plan once it is decided (a new round of reports starts empty). */
  removeAll(target: ModerationTarget): Promise<void>;
  /** Tallies of several items for one viewer (`myVote`); missing items have no votes. */
  tallies(targets: ModerationTarget[], viewerId: string): Promise<Map<string, VoteTally & { myVote: VoteChoice | null }>>;
}
