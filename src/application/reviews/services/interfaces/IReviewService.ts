import { ReviewData } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { UserRole } from "@/domain/users/entities/User";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface ReviewActor {
  id: string;
  role: UserRole;
}

export interface ListPlaceReviewsOptions {
  /** MODERATOR / ADMIN may list the reviews of a place that is not PUBLISHED. */
  canSeeUnpublishedPlace: boolean;
}

export interface ReviewQueueFilters {
  statuses?: ContentStatus[];
  placeId?: string;
}

export interface IReviewService {
  /** PUBLISHED reviews of a place. 404 `PlaceNotFoundError` if the place is missing or not visible. */
  listForPlace(placeId: string, params: PaginationParams, options: ListPlaceReviewsOptions): Promise<PaginatedResult<ReviewDetail>>;
  /** The caller's own reviews, any status. */
  listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<ReviewDetail>>;
  /** Moderation queue. */
  list(params: PaginationParams, filters: ReviewQueueFilters): Promise<PaginatedResult<ReviewDetail>>;
  /** Creates a PENDING review. 404 unless the place is PUBLISHED; 409 if the user already reviewed it. */
  create(userId: string, placeId: string, data: ReviewData): Promise<ReviewDetail>;
  /** Owner only (403 otherwise). Replaces rating/comment and sends the review back to PENDING. */
  update(userId: string, id: string, data: ReviewData): Promise<ReviewDetail>;
  /** Owner, MODERATOR or ADMIN (403 otherwise). */
  delete(actor: ReviewActor, id: string): Promise<void>;
  changeStatus(id: string, status: ContentStatus): Promise<ReviewDetail>;
}
