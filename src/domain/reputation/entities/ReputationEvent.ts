import { ReputationKind } from "../reputationRules";

/** One entry of a user's reputation history. `delta` is what was applied (see `appliedDelta`). */
export interface ReputationEvent {
  kind: ReputationKind;
  delta: number;
  createdAt: Date;
}

/**
 * What caused an entry. The key is unique, so the same cause never gives points twice (a repeated
 * request, a retried transaction) and an undo knows which entry to remove.
 */
export const reputationCause = {
  submissionApproved: (submissionId: string) => `submission-approved:${submissionId}`,
  submissionRejected: (submissionId: string) => `submission-rejected:${submissionId}`,
  /** Once per person and plan: answering again does not give points again. */
  verification: (type: "PLACE" | "EVENT", planId: string, userId: string) => `verification:${type}:${planId}:${userId}`,
  /** Removed when the vote is undone, so marking again gives the point back. */
  usefulVote: (reviewId: string, voterId: string) => `useful:${reviewId}:${voterId}`,
  /** One per moderator decision (a plan can be hidden again after being republished). */
  planHidden: (type: "PLACE" | "EVENT", planId: string, at: Date) => `plan-hidden:${type}:${planId}:${at.toISOString()}`,
  /** One per vote row: changing the choice keeps it, undoing removes it, a new round of reports is a new row. */
  moderationVote: (voteId: string) => `moderation-vote:${voteId}`,
  /** The vote ended on the losing side of a decided item. */
  moderationMinority: (voteId: string) => `moderation-minority:${voteId}`,
};
