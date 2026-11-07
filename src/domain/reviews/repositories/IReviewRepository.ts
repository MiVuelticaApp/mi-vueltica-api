import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { NormalizedReviewData, Review } from "../entities/Review";
import { ReviewDetail } from "../entities/ReviewDetail";
import { RatingSummary } from "../entities/RatingSummary";
import { WentWith } from "../valueObjects/reviewExperience.valueObject";
import { ReviewTarget } from "../valueObjects/reviewTarget.valueObject";

/** `usefulCount` = number of "útil" votes, `photoCount` = number of photos (`-photoCount` puts reviews with photos first). */
export const REVIEW_SORT_FIELDS = ["createdAt", "rating", "usefulCount", "photoCount"] as const;
export type ReviewSortField = (typeof REVIEW_SORT_FIELDS)[number];

export interface ReviewListFilters {
  /** Omitted = every status. */
  statuses?: ContentStatus[];
  /**
   * Also include this user's own PENDING reviews, whatever `statuses` says (the author sees their
   * review right after writing it, before moderation).
   */
  includePendingOf?: string;
  placeId?: string;
  eventId?: string;
  userId?: string;
  /** Reviewer went with any of these. */
  wentWith?: WentWith[];
  /** Only reviews with at least one photo. */
  withPhotos?: boolean;
}

/** A photo already resolved to one of the author's uploads (canonical URL). */
export interface ReviewPhotoInput {
  uploadId: string;
  url: string;
}

export interface CreateReviewData extends Omit<NormalizedReviewData, "photos"> {
  userId: string;
  target: ReviewTarget;
  photos: ReviewPhotoInput[];
}

export interface IReviewRepository {
  /**
   * Paginated list. Default order is `createdAt` descending unless `params.sort` is given; then
   * `createdAt` descending and `id` break ties so pages are stable. `viewerId` fills `markedUsefulByMe`.
   */
  list(params: PaginationParams, filters: ReviewListFilters, viewerId?: string): Promise<PaginatedResult<ReviewDetail>>;
  find(id: string): Promise<Review | null>;
  findDetail(id: string, viewerId?: string): Promise<ReviewDetail | null>;
  existsForUserAndTarget(userId: string, target: ReviewTarget): Promise<boolean>;
  /** Inserts a PENDING review with its photos. A duplicate (user, target) fails with a P2002 cause (409). */
  create(data: CreateReviewData): Promise<ReviewDetail>;
  /** Persists rating, comment, wentWith, spent and status; replaces the photos when `photos` is given. */
  save(review: Review, photos?: ReviewPhotoInput[], viewerId?: string): Promise<ReviewDetail>;
  /** Returns false when the review did not exist. */
  delete(id: string): Promise<boolean>;
  /** Rating summary of the PUBLISHED reviews of a place or event. */
  summary(target: ReviewTarget): Promise<RatingSummary>;
  /** Idempotent: a repeated vote is ignored. */
  addUsefulVote(reviewId: string, userId: string): Promise<void>;
  /** Idempotent: removing a vote that does not exist is fine. */
  removeUsefulVote(reviewId: string, userId: string): Promise<void>;
}
