import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { ReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";
import { ReportDecision } from "@/domain/community/rules/reportRules";

/** Same shape as the app's `VerifyResult`. */
export interface VerifyResponse {
  queued: boolean;
  points: number;
  hidden: boolean;
}

/** The reporter is never included. */
export interface ReportResponse {
  id: string;
  placeId: string | null;
  eventId: string | null;
  reason: ReportReason;
  details: string | null;
  photo: string | null;
  createdAt: string;
}

export interface CreateReportResponse extends ReportResponse {
  /** The plan was hidden by this report. */
  hidden: boolean;
}

export interface ReportQueueItemResponse {
  type: "PLACE" | "EVENT";
  placeId: string | null;
  eventId: string | null;
  title: string;
  status: ContentStatus;
  hiddenReason: string | null;
  reportedAt: string | null;
  needsReview: boolean;
  reportCount: number;
  topReason: ReportReason | null;
  reasons: Partial<Record<ReportReason, number>>;
  firstReportAt: string;
  lastReportAt: string;
  reports: ReportResponse[];
}

export interface ReportDecisionResponse {
  placeId: string | null;
  eventId: string | null;
  decision: ReportDecision;
  status: ContentStatus;
  hiddenReason: string | null;
  resolvedReports: number;
}

/** Verification fields added to the place / event detail. */
export interface VerificationFieldsResponse {
  lastVerifiedAt: string | null;
  verificationCount: number;
  /** Whether the caller (user, or guest by `X-Device-Id`) verified it today, Costa Rica time. */
  myVerifiedToday: boolean;
}
