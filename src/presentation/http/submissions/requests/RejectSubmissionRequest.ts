import { RejectionReason } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";

/** Validated body (after `RejectSubmissionSchema`: legacy free text is already turned into `otro`). */
export interface RejectSubmissionRequest {
  reason: RejectionReason;
  /** Required for `otro`. */
  note: string | null;
}
