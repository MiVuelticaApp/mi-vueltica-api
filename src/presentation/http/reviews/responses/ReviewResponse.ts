import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { SpentTier, WentWith } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { PaginatedResponse } from "@/presentation/http/core/responses/PaginatedResponse";
import { RatingSummaryResponse } from "./RatingSummaryResponse";

export interface ReviewAuthorResponse {
  /** Null only for a review without an author (reviews are deleted with the account). */
  id: string | null;
  /** Author's first name, or "Anónimo" for a review without an author. */
  name: string;
  initials: string;
}

export interface ReviewResponse {
  id: string;
  /** Exactly one of `placeId` / `eventId` is set. */
  placeId: string | null;
  eventId: string | null;
  rating: number;
  comment: string | null;
  wentWith: WentWith | null;
  spent: SpentTier | null;
  /** Photo URLs, in the order the author attached them. */
  photos: string[];
  usefulCount: number;
  /** False for anonymous callers. */
  markedUsefulByMe: boolean;
  status: ContentStatus;
  createdAt: string;
  author: ReviewAuthorResponse;
  place: { id: string; name: string } | null;
  event: { id: string; title: string } | null;
}

/** GET /places/:placeId/reviews and GET /events/:eventId/reviews. */
export interface TargetReviewListResponse extends PaginatedResponse<ReviewResponse> {
  summary: RatingSummaryResponse;
}
