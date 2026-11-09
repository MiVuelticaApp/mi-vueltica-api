import { Submission } from "@/domain/submissions/entities/Submission";
import { SubmissionPayloadInput } from "@/domain/submissions/entities/SubmissionPayload";
import { SubmissionSortField } from "@/domain/submissions/repositories/ISubmissionRepository";
import { SubmissionType } from "@/domain/submissions/valueObjects/submissionType.valueObject";
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
  deleteMine(userId: string, id: string): Promise<void>;

  // Moderation side (MODERATOR / ADMIN).
  listQueue(params: PaginationParams<SubmissionSortField>, filters?: SubmissionQueueFilters): Promise<PaginatedResult<Submission>>;
  get(id: string): Promise<Submission>;
  approve(id: string, reviewerId: string): Promise<SubmissionApprovalResult>;
  reject(id: string, reviewerId: string, reason: string): Promise<Submission>;
}
