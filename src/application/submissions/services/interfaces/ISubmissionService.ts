import { Submission } from "@/domain/submissions/entities/Submission";
import { SubmissionPayloadInput } from "@/domain/submissions/entities/SubmissionPayload";
import { SubmissionSortField } from "@/domain/submissions/repositories/ISubmissionRepository";
import { SubmissionType } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { RejectionReason } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface SubmissionQueueFilters {
  status?: ContentStatus;
  type?: SubmissionType;
}

export interface SubmissionApprovalResult {
  submission: Submission;
  /** The Place or Event created from the submission. */
  created: { type: SubmissionType; id: string };
}

export interface SubmissionRejection {
  reason: RejectionReason;
  /** Required for `otro`. */
  note?: string | null;
}

export interface ISubmissionService {
  // Author side: a user only ever sees their own submissions.
  create(userId: string, payload: SubmissionPayloadInput): Promise<Submission>;
  /** Only the author's own; `filters` narrows by status / type (no filter = all of them). */
  listMine(
    userId: string,
    params: PaginationParams<SubmissionSortField>,
    filters?: SubmissionQueueFilters,
  ): Promise<PaginatedResult<Submission>>;
  getMine(userId: string, id: string): Promise<Submission>;
  /**
   * Full replace of a PENDING submission by its author (same rules as `create`). 404 if it is not
   * theirs, 409 if no longer pending, 422 `SubmissionTypeChangeError` if the type changes.
   */
  updateMine(userId: string, id: string, payload: SubmissionPayloadInput): Promise<Submission>;
  deleteMine(userId: string, id: string): Promise<void>;

  // Moderation side (MODERATOR / ADMIN).
  listQueue(params: PaginationParams<SubmissionSortField>, filters?: SubmissionQueueFilters): Promise<PaginatedResult<Submission>>;
  get(id: string): Promise<Submission>;
  approve(id: string, reviewerId: string): Promise<SubmissionApprovalResult>;
  reject(id: string, reviewerId: string, rejection: SubmissionRejection): Promise<Submission>;
}
