import { SubmissionType } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { RejectionReason } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";

/** What the author sees of their own submission. */
export interface SubmissionResponse {
  id: string;
  userId: string;
  type: SubmissionType;
  /** The suggested Place/Event fields (event dates as ISO 8601 UTC strings). */
  data: Record<string, unknown>;
  status: ContentStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  /** Rejection code (`REJECTION_REASONS`); null unless rejected, and for rejections from before #40. */
  rejectionReason: RejectionReason | null;
  /** The moderator's written note (required for `otro`). */
  reviewNote: string | null;
  /** What to show the author when rejected: the code's text, or the note for `otro`. Null otherwise. */
  rejectionMessage: string | null;
  /** The Place/Event it became once approved; null before that, for approvals from before #40 or if it was deleted. */
  created: { type: SubmissionType; id: string } | null;
  createdAt: string;
}

/** Moderators additionally see the AI pre-screening fields. */
export interface ModerationSubmissionResponse extends SubmissionResponse {
  aiScore: number | null;
  aiReason: string | null;
}

export interface ApproveSubmissionResponse {
  submission: ModerationSubmissionResponse;
  created: { type: SubmissionType; id: string };
}
