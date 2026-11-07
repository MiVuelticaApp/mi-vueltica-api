import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { NormalizedReviewData, Review } from "../entities/Review";
import { ReviewDetail } from "../entities/ReviewDetail";

export const REVIEW_SORT_FIELDS = ["createdAt", "rating"] as const;

export interface ReviewListFilters {
  /** Omitted = every status. */
  statuses?: ContentStatus[];
  placeId?: string;
  userId?: string;
}

export interface CreateReviewData extends NormalizedReviewData {
  userId: string;
  placeId: string;
}

export interface IReviewRepository {
  /**
   * Paginated list. Default order is `createdAt` descending unless `params.sort` is given; `id` is the
   * tie-breaker so pages are stable.
   */
  list(params: PaginationParams, filters: ReviewListFilters): Promise<PaginatedResult<ReviewDetail>>;
  find(id: string): Promise<Review | null>;
  findDetail(id: string): Promise<ReviewDetail | null>;
  existsForUserAndPlace(userId: string, placeId: string): Promise<boolean>;
  /** Inserts a PENDING review. A duplicate (userId, placeId) fails with a P2002 cause (409). */
  create(data: CreateReviewData): Promise<ReviewDetail>;
  /** Persists rating, comment and status. */
  save(review: Review): Promise<ReviewDetail>;
  /** Returns false when the review did not exist. */
  delete(id: string): Promise<boolean>;
}
