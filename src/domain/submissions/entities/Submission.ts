import DataException from "@/domain/core/errors/DataError";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { ReviewNote } from "../valueObjects/reviewNote.valueObject";
import { SubmissionType } from "../valueObjects/submissionType.valueObject";
import {
  REJECTION_NOTE_REQUIRED_ERROR,
  RejectionReason,
  parseRejectionReason,
  rejectionMessage,
} from "../valueObjects/rejectionReason.valueObject";
import { SubmissionPayload, SubmissionPayloadInput, normalizeSubmissionPayload } from "./SubmissionPayload";

/** The Place or Event an approved submission created. */
export interface SubmissionCreated {
  type: SubmissionType;
  id: string;
}

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
      rejectionReason: props.rejectionReason ? parseRejectionReason(props.rejectionReason) : null,
      created: props.created ?? null,
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
  /** The moderator's written note (required for `otro`, optional for the other reasons). */
  get reviewNote() { return this.props.reviewNote?.value ?? null; }
  /** Null unless rejected; rejections from before #40 have only `reviewNote`. */
  get rejectionReason() { return this.props.rejectionReason; }
  /** What the author reads: the reason's label, or the note for `otro` (see `rejectionMessage`). */
  get rejectionMessage() { return this.props.status === "REJECTED" ? rejectionMessage(this.rejectionReason, this.reviewNote) : null; }
  /** Set once approved; back to null if that Place/Event is deleted (or for approvals from before #40). */
  get created() { return this.props.created; }
  get createdAt() { return this.props.createdAt; }

  /** Only PENDING submissions can be approved, rejected, edited or withdrawn by their author. */
  isPending() { return this.props.status === "PENDING"; }

  belongsTo(userId: string) { return this.props.userId === userId; }

  /** Full replace of the suggestion while PENDING. The type cannot change. */
  edit(payload: SubmissionPayloadInput | SubmissionPayload) {
    const next = normalizeSubmissionPayload(payload);
    if (next.type !== this.type) throw new DataException("No se puede cambiar el tipo de una sugerencia");
    this.props.payload = next;
  }

  approve(reviewerId: string, now: Date, created: SubmissionCreated) {
    this.props.status = "PUBLISHED";
    this.props.reviewedById = reviewerId;
    this.props.reviewedAt = now;
    this.props.reviewNote = null;
    this.props.rejectionReason = null;
    this.props.created = created;
  }

  /** `otro` needs a note; for the other reasons the note is optional. */
  reject(reviewerId: string, reason: RejectionReason, note: string | null, now: Date) {
    const parsed = parseRejectionReason(reason);
    const trimmed = note?.trim() || null;
    if (parsed === "otro" && !trimmed) throw new DataException(REJECTION_NOTE_REQUIRED_ERROR);
    this.props.rejectionReason = parsed;
    this.props.reviewNote = trimmed ? ReviewNote.create(trimmed) : null;
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
  rejectionReason: RejectionReason | null;
  created: SubmissionCreated | null;
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
  rejectionReason?: RejectionReason | null;
  created?: SubmissionCreated | null;
  createdAt: Date;
}
