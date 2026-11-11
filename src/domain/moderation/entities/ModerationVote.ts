import { ModerationDecision, VoteChoice, VoteTally } from "../moderationRules";

/** What a moderation vote is about: a pending suggestion, or a reported Place / Event. */
export const MODERATION_TARGET_TYPES = ["SUBMISSION", "PLACE", "EVENT"] as const;
export type ModerationTargetType = (typeof MODERATION_TARGET_TYPES)[number];

export interface ModerationTarget {
  type: ModerationTargetType;
  id: string;
}

export const moderationTargetKey = (target: ModerationTarget) => `${target.type}:${target.id}`;

export interface StoredVote {
  id: string;
  userId: string;
  choice: VoteChoice;
  /** 1, or 2 for level 5 (fixed when the vote is cast or changed). */
  weight: number;
}

/** Tally of one item as one voter sees it. */
export interface ModerationTally extends VoteTally {
  votesNeeded: number;
  /** The viewer's current vote, if any. */
  myVote: VoteChoice | null;
}

/** Result of a vote or of its undo (the app's `ModerationItem`). */
export interface ModerationVoteResult extends ModerationTally {
  target: ModerationTarget;
  kind: "nueva" | "reportada";
  /** `pending` until the needed votes are in; then what the community decided. */
  decision: ModerationDecision;
}

/** Adds up stored votes (weights) and finds the viewer's one. */
export function tallyVotes(votes: StoredVote[], viewerId: string | null): VoteTally & { myVote: VoteChoice | null } {
  let votesFor = 0;
  let votesAgainst = 0;
  let myVote: VoteChoice | null = null;
  for (const vote of votes) {
    if (vote.choice === "for") votesFor += vote.weight;
    else votesAgainst += vote.weight;
    if (vote.userId === viewerId) myVote = vote.choice;
  }
  return { votesFor, votesAgainst, myVote };
}
