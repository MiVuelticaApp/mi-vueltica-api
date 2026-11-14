import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { ReviewReportReason } from "../rules/reviewReportRules";

export interface NewReviewReport {
  reviewId: string;
  userId: string;
  reason: ReviewReportReason;
  details: string | null;
}

/** Review reports (#16). Inside `IReviewReportUnitOfWork` every method shares one transaction. */
export interface IReviewReportRepository {
  /** `SELECT ... FOR UPDATE` on the review: reports on the same review are applied one at a time. Null if it is gone. */
  lockReview(reviewId: string): Promise<{ userId: string | null; status: ContentStatus } | null>;
  /** False when this user already reported this review (unique index). */
  add(report: NewReviewReport): Promise<boolean>;
  countUnresolved(reviewId: string): Promise<number>;
  /** Back to PENDING: off the public lists and the rating, into the moderators' review queue. */
  hideReview(reviewId: string): Promise<void>;
  /** Marks the review's pending reports as decided. */
  resolveAll(reviewId: string): Promise<void>;
}
