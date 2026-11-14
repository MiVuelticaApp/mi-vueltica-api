import { RejectionReason } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";

/** Validated body (after `RejectSubmissionSchema`: `reason` is one of the codes, `note` is null when empty). */
export interface RejectSubmissionRequest {
  reason: RejectionReason;
  /** Required for `otro`. */
  note: string | null;
}
