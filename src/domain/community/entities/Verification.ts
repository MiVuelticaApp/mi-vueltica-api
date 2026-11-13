import { PricePaid, StillHappening } from "../valueObjects/verificationAnswers.valueObject";

/** Verification read by the outcome rules (only the rows not consumed by a previous outcome). */
export interface CountingVerification {
  stillHappening: StillHappening;
  pricePaid: PricePaid | null;
  /** Null for guests and for deleted accounts. */
  userId: string | null;
  /** The verifier's current reputation points; null when `userId` is null. */
  userPoints: number | null;
}

/** Verification fields of a place / event detail. */
export interface VerificationSummary {
  /** Latest verification (any person); null when never verified. */
  lastVerifiedAt: Date | null;
  /** Number of people who verified it (one per person; a newer answer replaces the previous one). */
  verificationCount: number;
  /** Whether the caller (user or device) verified it today, Costa Rica time. */
  myVerifiedToday: boolean;
}
