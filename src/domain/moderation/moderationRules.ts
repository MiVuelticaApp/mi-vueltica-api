/**
 * Community moderation (#43): ports of the app's `votesNeeded`, `voteWeight`, `decideNew`, `decideReported`
 * and `isMinorityVote` (src/domain/rules.ts in mi-vueltica-app). Change the numbers here only.
 */
import DataException from "@/domain/core/errors/DataError";
import { ReputationLevel, hasPerk, levelFor } from "@/domain/reputation/reputationRules";
import { UserRole } from "@/domain/users/entities/User";

/** `for` publishes a new suggestion / hides a reported plan; `against` rejects it / keeps the plan. */
export const VOTE_CHOICES = ["for", "against"] as const;
export type VoteChoice = (typeof VOTE_CHOICES)[number];

/** Weighted votes needed to decide a new suggestion (app: 5, or 3 when the author is level 3+). */
export const NEW_VOTES_NEEDED = 5;
export const TRUSTED_AUTHOR_VOTES_NEEDED = 3;
/** Weighted votes needed to decide a reported plan ("Sigue igual" / "Ocultar"). */
export const REPORTED_VOTES_NEEDED = 3;
/** Items per list in `GET /moderation/queue` (oldest first). */
export const MODERATION_QUEUE_LIMIT = 50;
/** Note stored on a suggestion the community rejected (reason `otro`; same text as the app). */
export const COMMUNITY_REJECTION_NOTE = "La comunidad no la aprobó";

export type NewDecision = "pending" | "publish" | "reject";
export type ReportedDecision = "pending" | "hide" | "keep";
export type ModerationDecision = NewDecision | ReportedDecision;

export interface VoteTally {
  /** Sum of the weights of the `for` votes. */
  votesFor: number;
  votesAgainst: number;
}

export function parseVoteChoice(value: unknown): VoteChoice {
  if (typeof value === "string" && (VOTE_CHOICES as readonly string[]).includes(value)) return value as VoteChoice;
  throw new DataException(`choice debe ser uno de: ${VOTE_CHOICES.join(", ")}`);
}

/**
 * The level a voter moderates with: their reputation level, and at least level 3 for the team roles
 * (MODERATOR / ADMIN are staff, so they always may vote).
 */
export function moderatorLevel(role: UserRole, points: number): ReputationLevel {
  const level = levelFor(points);
  return role !== "USER" && level < 3 ? 3 : level;
}

export function canModerate(role: UserRole, points: number): boolean {
  return hasPerk(moderatorLevel(role, points), "moderation");
}

/** Level 5 votes count double. */
export function moderationVoteWeight(level: ReputationLevel): number {
  return hasPerk(level, "doubleModerationVote") ? 2 : 1;
}

/** The author's reputation decides how many votes their suggestion needs. */
export function votesNeededForSubmission(authorPoints: number): number {
  return hasPerk(levelFor(authorPoints), "moderation") ? TRUSTED_AUTHOR_VOTES_NEEDED : NEW_VOTES_NEEDED;
}

/** New suggestion: once the needed votes are in, the majority decides; a tie rejects it (app rule). */
export function decideNew(tally: VoteTally, votesNeeded: number): NewDecision {
  if (tally.votesFor + tally.votesAgainst < votesNeeded) return "pending";
  return tally.votesFor > tally.votesAgainst ? "publish" : "reject";
}

/** Reported plan: `for` = hide. A tie keeps it. */
export function decideReported(tally: VoteTally, votesNeeded: number): ReportedDecision {
  if (tally.votesFor + tally.votesAgainst < votesNeeded) return "pending";
  return tally.votesFor > tally.votesAgainst ? "hide" : "keep";
}

/** The side that lost a decided vote; null on a tie (nobody is penalized). */
export function losingChoice(tally: VoteTally): VoteChoice | null {
  if (tally.votesFor === tally.votesAgainst) return null;
  return tally.votesFor > tally.votesAgainst ? "against" : "for";
}
