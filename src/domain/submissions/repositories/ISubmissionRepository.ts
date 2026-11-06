import { Submission } from "@/domain/submissions/entities/Submission";
import { SubmissionPayload } from "@/domain/submissions/entities/SubmissionPayload";
import { SubmissionType } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const SUBMISSION_SORT_FIELDS = ["createdAt"] as const;
export type SubmissionSortField = (typeof SUBMISSION_SORT_FIELDS)[number];

export interface SubmissionListFilters {
  /** Restricts the list to one author (the "my submissions" view). */
  userId?: string;
  status?: ContentStatus;
  type?: SubmissionType;
}

export interface NewSubmission {
  userId: string;
  payload: SubmissionPayload;
  /** Uploads referenced by `payload.data.photos`; linked so they are not cleaned up. */
  uploadIds: string[];
}

export interface ISubmissionRepository {
  /** New submissions are always PENDING. */
  create(data: NewSubmission): Promise<Submission>;
  find(id: string): Promise<Submission | null>;
  /**
   * Like `find`, but first locks the row (`SELECT ... FOR UPDATE`) until the surrounding
   * transaction ends, so concurrent reviewers of the same submission run one after another.
   * Only meaningful inside a unit of work.
   */
  findForUpdate(id: string): Promise<Submission | null>;
  list(params: PaginationParams<SubmissionSortField>, filters?: SubmissionListFilters): Promise<PaginatedResult<Submission>>;
  /**
   * Persists the review fields (status, reviewer, date, note) only if the row is still PENDING.
   * Returns false when someone else reviewed or withdrew it first.
   */
  markReviewed(submission: Submission): Promise<boolean>;
  /** Deletes the submission only if it belongs to `userId` and is still PENDING. */
  deletePendingOwned(id: string, userId: string): Promise<boolean>;
}
