import { ReviewData } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";
import { ReviewAudience } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { ReviewTarget } from "@/domain/reviews/valueObjects/reviewTarget.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { UserRole } from "@/domain/users/entities/User";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { ReviewReportReason } from "@/domain/reviews/rules/reviewReportRules";

export interface ReviewReportInput {
  reason: ReviewReportReason;
  /** Trimmed; blank → null. */
  details: string | null;
}

export interface ReviewActor {
  id: string;
  role: UserRole;
}

export interface ListTargetReviewsOptions {
  /** The authenticated caller, if any: sees their own PENDING review and gets `markedUsefulByMe`. */
  viewerId?: string;
  /** MODERATOR / ADMIN may list the reviews of a place / event that is not PUBLISHED. */
  canSeeUnpublishedTarget: boolean;
  /** `familias` → went with family; `estudiantes` → went with friends or alone. */
  audience?: ReviewAudience;
  /** Only reviews with photos. */
  withPhotos?: boolean;
  /** Reviews written by these users (the viewer's blocked people, #17) are left out of the list. */
  excludeUserIds?: string[];
}

export interface TargetReviewList {
  page: PaginatedResult<ReviewDetail>;
  /** Over every PUBLISHED review of the place / event (ignores the filters). */
  summary: RatingSummary;
}

export interface ReviewQueueFilters {
  statuses?: ContentStatus[];
  placeId?: string;
  eventId?: string;
}

export interface IReviewService {
  /**
   * PUBLISHED reviews of a place / event (plus the viewer's own PENDING one) and the rating summary.
   * 404 `PlaceNotFoundError` / `EventNotFoundError` if it is missing or not visible.
   */
  listForTarget(target: ReviewTarget, params: PaginationParams, options: ListTargetReviewsOptions): Promise<TargetReviewList>;
  /** The caller's own reviews, any status. */
  listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<ReviewDetail>>;
  /** Moderation queue. */
  list(params: PaginationParams, filters: ReviewQueueFilters, viewerId?: string): Promise<PaginatedResult<ReviewDetail>>;
  /**
   * Creates a PENDING review. 404 unless the place / event is PUBLISHED; 409 if the user already
   * reviewed it; 422 if a photo is not one of the user's uploads.
   */
  create(userId: string, target: ReviewTarget, data: ReviewData): Promise<ReviewDetail>;
  /** Owner only (403 otherwise). Full replace (photos included); sends the review back to PENDING. */
  update(userId: string, id: string, data: ReviewData): Promise<ReviewDetail>;
  /** Owner, MODERATOR or ADMIN (403 otherwise). */
  delete(actor: ReviewActor, id: string): Promise<void>;
  /** MODERATOR / ADMIN decision; also resolves the review's pending reports. */
  changeStatus(id: string, status: ContentStatus, viewerId?: string): Promise<ReviewDetail>;
  /**
   * Reports a PUBLISHED review (404 otherwise; 403 on the caller's own; 409 if already reported, also after a
   * decision). At three unresolved reports it goes back to PENDING (`hidden: true`).
   */
  report(userId: string, id: string, input: ReviewReportInput): Promise<{ hidden: boolean }>;
  /**
   * "Útil" vote, idempotent. Only on PUBLISHED reviews (404 otherwise); 403 on the caller's own review.
   * Returns the review with the updated `usefulCount` / `markedUsefulByMe`.
   */
  markUseful(userId: string, id: string): Promise<ReviewDetail>;
  /** Removes the caller's vote, idempotent. 404 unless the review is PUBLISHED. */
  unmarkUseful(userId: string, id: string): Promise<ReviewDetail>;
}
