/** A review is about exactly one Place or one Event (enforced by the application, not the DB). */
export const REVIEW_TARGET_TYPES = ["PLACE", "EVENT"] as const;
export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

export interface ReviewTarget {
  type: ReviewTargetType;
  id: string;
}
