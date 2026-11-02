import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { ReviewNote } from "../valueObjects/reviewNote.valueObject";
import { SubmissionPayload, SubmissionPayloadInput, normalizeSubmissionPayload } from "./SubmissionPayload";

/**
 * A community suggestion of a Place or Event. It becomes real content only when a
 * MODERATOR/ADMIN approves it; `aiScore`/`aiReason` are reserved for the AI moderation job.
 */
export class Submission {
  private props: SubmissionProps;

  constructor(props: SubmissionConstructorProps) {
    this.props = {
      id: props.id,
      userId: props.userId,
      payload: normalizeSubmissionPayload(props.payload),
      status: parseContentStatus(props.status),
      aiScore: props.aiScore ?? null,
      aiReason: props.aiReason ?? null,
      reviewedById: props.reviewedById ?? null,
      reviewedAt: props.reviewedAt ?? null,
      reviewNote: props.reviewNote ? ReviewNote.create(props.reviewNote) : null,
      createdAt: props.createdAt,
    };
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get type() { return this.props.payload.type; }
  get payload() { return this.props.payload; }
  get status() { return this.props.status; }
  get aiScore() { return this.props.aiScore; }
  get aiReason() { return this.props.aiReason; }
  get reviewedById() { return this.props.reviewedById; }
  get reviewedAt() { return this.props.reviewedAt; }
  get reviewNote() { return this.props.reviewNote?.value ?? null; }
  get createdAt() { return this.props.createdAt; }

  /** Only PENDING submissions can be approved, rejected or withdrawn by their author. */
  isPending() { return this.props.status === "PENDING"; }

  belongsTo(userId: string) { return this.props.userId === userId; }

  approve(reviewerId: string, now: Date) {
    this.props.status = "PUBLISHED";
    this.props.reviewedById = reviewerId;
    this.props.reviewedAt = now;
    this.props.reviewNote = null;
  }

  reject(reviewerId: string, reason: string, now: Date) {
    this.props.reviewNote = ReviewNote.create(reason);
    this.props.status = "REJECTED";
    this.props.reviewedById = reviewerId;
    this.props.reviewedAt = now;
  }
}

export interface SubmissionProps {
  id: string;
  userId: string;
  payload: SubmissionPayload;
  status: ContentStatus;
  aiScore: number | null;
  aiReason: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNote: ReviewNote | null;
  createdAt: Date;
}

export interface SubmissionConstructorProps {
  id: string;
  userId: string;
  payload: SubmissionPayloadInput | SubmissionPayload;
  status: ContentStatus;
  aiScore?: number | null;
  aiReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
  createdAt: Date;
}
