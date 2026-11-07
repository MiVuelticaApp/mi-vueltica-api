import DataException from "@/domain/core/errors/DataError";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { Rating } from "../valueObjects/rating.valueObject";
import { ReviewComment } from "../valueObjects/reviewComment.valueObject";
import { SpentTier, WentWith, parseSpentTier, parseWentWith } from "../valueObjects/reviewExperience.valueObject";
import { normalizeReviewPhotoUrls } from "../valueObjects/reviewPhotos.valueObject";
import { ReviewTarget } from "../valueObjects/reviewTarget.valueObject";

/** Editable fields of a review (create and full-replace update). */
export interface ReviewData {
  rating: number;
  comment?: string | null;
  wentWith?: WentWith | null;
  spent?: SpentTier | null;
  /** URLs returned by `POST /uploads` (the author's own). Omitted = no photos. */
  photos?: string[] | null;
}

/** `ReviewData` after running every field through its value object. */
export interface NormalizedReviewData {
  rating: number;
  comment: string | null;
  wentWith: WentWith | null;
  spent: SpentTier | null;
  photos: string[];
}

/** Validates and normalizes editable data. Throws `DataException`. */
export function normalizeReviewData(data: ReviewData): NormalizedReviewData {
  return {
    rating: Rating.create(data.rating).value,
    comment: ReviewComment.create(data.comment).value,
    wentWith: parseWentWith(data.wentWith),
    spent: parseSpentTier(data.spent),
    photos: normalizeReviewPhotoUrls(data.photos),
  };
}

/**
 * A user's rating of a place or an event. One per user and place/event. New and edited reviews are
 * PENDING until a moderator publishes them; only PUBLISHED reviews are public and count towards the
 * rating. `userId` is null once the author deleted their account (the review is kept anonymized).
 * Photos and "útil" votes live in their own tables and are read through `ReviewDetail`.
 */
export class Review {
  private props: ReviewProps;

  constructor(props: ReviewConstructorProps) {
    const placeId = props.placeId ?? null;
    const eventId = props.eventId ?? null;
    if ((placeId === null) === (eventId === null)) {
      throw new DataException("Una reseña debe pertenecer a un lugar o a un evento (solo uno)");
    }
    this.props = {
      id: props.id,
      userId: props.userId,
      placeId,
      eventId,
      rating: Rating.create(props.rating),
      comment: ReviewComment.create(props.comment),
      wentWith: parseWentWith(props.wentWith),
      spent: parseSpentTier(props.spent),
      status: parseContentStatus(props.status),
      createdAt: props.createdAt,
    };
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get placeId() { return this.props.placeId; }
  get eventId() { return this.props.eventId; }
  get rating() { return this.props.rating.value; }
  get comment() { return this.props.comment.value; }
  get wentWith() { return this.props.wentWith; }
  get spent() { return this.props.spent; }
  get status() { return this.props.status; }
  get createdAt() { return this.props.createdAt; }

  get target(): ReviewTarget {
    return this.props.placeId !== null
      ? { type: "PLACE", id: this.props.placeId }
      : { type: "EVENT", id: this.props.eventId as string };
  }

  /** False for anonymized reviews (the author deleted their account). */
  isOwnedBy(userId: string): boolean {
    return this.props.userId !== null && this.props.userId === userId;
  }

  /**
   * Replaces the editable fields (photos are replaced by the repository). The review goes back to
   * PENDING for moderation. Returns the normalized data.
   */
  edit(data: ReviewData): NormalizedReviewData {
    const normalized = normalizeReviewData(data);
    this.props.rating = Rating.create(normalized.rating);
    this.props.comment = ReviewComment.create(normalized.comment);
    this.props.wentWith = normalized.wentWith;
    this.props.spent = normalized.spent;
    this.props.status = "PENDING";
    return normalized;
  }

  changeStatus(status: ContentStatus): void {
    this.props.status = parseContentStatus(status);
  }
}

export interface ReviewProps {
  id: string;
  userId: string | null;
  placeId: string | null;
  eventId: string | null;
  rating: Rating;
  comment: ReviewComment;
  wentWith: WentWith | null;
  spent: SpentTier | null;
  status: ContentStatus;
  createdAt: Date;
}

export interface ReviewConstructorProps {
  id: string;
  userId: string | null;
  placeId?: string | null;
  eventId?: string | null;
  rating: number;
  comment?: string | null;
  wentWith?: WentWith | null;
  spent?: SpentTier | null;
  status: ContentStatus;
  createdAt: Date;
}
