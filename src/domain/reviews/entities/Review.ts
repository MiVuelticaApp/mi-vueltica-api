import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { Rating } from "../valueObjects/rating.valueObject";
import { ReviewComment } from "../valueObjects/reviewComment.valueObject";

/** Editable fields of a review (create and full-replace update). */
export interface ReviewData {
  rating: number;
  comment?: string | null;
}

/** `ReviewData` after running every field through its value object. */
export interface NormalizedReviewData {
  rating: number;
  comment: string | null;
}

/** Validates and normalizes editable data (rating 1-5, comment trimmed, blank -> null). Throws `DataException`. */
export function normalizeReviewData(data: ReviewData): NormalizedReviewData {
  return {
    rating: Rating.create(data.rating).value,
    comment: ReviewComment.create(data.comment).value,
  };
}

/**
 * A user's rating of a place. One per user and place. New and edited reviews are PENDING until a
 * moderator publishes them; only PUBLISHED reviews are public and count towards the place's rating.
 */
export class Review {
  private props: ReviewProps;

  constructor(props: ReviewConstructorProps) {
    this.props = {
      id: props.id,
      userId: props.userId,
      placeId: props.placeId,
      rating: Rating.create(props.rating),
      comment: ReviewComment.create(props.comment),
      status: parseContentStatus(props.status),
      createdAt: props.createdAt,
    };
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get placeId() { return this.props.placeId; }
  get rating() { return this.props.rating.value; }
  get comment() { return this.props.comment.value; }
  get status() { return this.props.status; }
  get createdAt() { return this.props.createdAt; }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  /** Replaces the rating and comment. The review goes back to PENDING for moderation. */
  edit(data: ReviewData): void {
    const normalized = normalizeReviewData(data);
    this.props.rating = Rating.create(normalized.rating);
    this.props.comment = ReviewComment.create(normalized.comment);
    this.props.status = "PENDING";
  }

  changeStatus(status: ContentStatus): void {
    this.props.status = parseContentStatus(status);
  }
}

export interface ReviewProps {
  id: string;
  userId: string;
  placeId: string;
  rating: Rating;
  comment: ReviewComment;
  status: ContentStatus;
  createdAt: Date;
}

export interface ReviewConstructorProps {
  id: string;
  userId: string;
  placeId: string;
  rating: number;
  comment?: string | null;
  status: ContentStatus;
  createdAt: Date;
}
