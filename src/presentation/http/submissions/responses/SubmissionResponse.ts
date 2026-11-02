import { SubmissionType } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

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
  /** Moderator's reason when rejected. */
  reviewNote: string | null;
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
