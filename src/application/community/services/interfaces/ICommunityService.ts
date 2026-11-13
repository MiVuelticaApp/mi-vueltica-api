import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { PersonKey } from "@/domain/community/valueObjects/personKey.valueObject";
import { PlanTarget } from "@/domain/community/valueObjects/planTarget.valueObject";
import { PricePaid, StillHappening } from "@/domain/community/valueObjects/verificationAnswers.valueObject";
import { ReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";
import { ReportDecision } from "@/domain/community/rules/reportRules";
import { Report, ReportQueueItem } from "@/domain/community/entities/Report";
import { VerificationSummary } from "@/domain/community/entities/Verification";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface VerifyInput {
  stillHappening: StillHappening;
  pricePaid?: PricePaid | null;
  scheduleCorrect?: boolean | null;
  correctedTime?: string | null;
  /** URL returned by `POST /uploads` (signed-in users only). */
  photo?: string | null;
}

/** Same shape as the app's `VerifyResult`. */
export interface VerifyResult {
  /** Always false: the server applies verifications immediately (the app queues them offline). */
  queued: boolean;
  /** Reputation points earned: 2 the first time a signed-in person verifies the plan, else 0. */
  points: number;
  /** The plan was hidden by this verification. */
  hidden: boolean;
}

export interface ReportInput {
  reason: ReportReason;
  details?: string | null;
  /** URL returned by `POST /uploads` (signed-in users only). */
  photo?: string | null;
}

export interface ReportResult {
  report: Report;
  /** The plan was hidden by this report (3 reports with the same reason). */
  hidden: boolean;
}

export interface ReportDecisionResult {
  target: PlanTarget;
  status: ContentStatus;
  hiddenReason: string | null;
  resolvedReports: number;
}

export interface ICommunityService {
  /** 404 unless the plan exists and is PUBLISHED. A newer answer by the same person replaces the previous one. */
  verify(person: PersonKey, target: PlanTarget, input: VerifyInput): Promise<VerifyResult>;
  /** 404 unless the plan exists and is PUBLISHED; 409 `ReportAlreadyExistsError` on a second report by the same person. */
  report(person: PersonKey, target: PlanTarget, input: ReportInput): Promise<ReportResult>;
  /** Verification fields of a detail response; `person` is the caller (user or device), if known. */
  verificationSummary(target: PlanTarget, person: PersonKey | null): Promise<VerificationSummary>;
  /** Moderation queue of reported plans. */
  reportQueue(params: PaginationParams): Promise<PaginatedResult<ReportQueueItem>>;
  /** `keep` publishes the plan, `hide` hides it; both resolve its reports. 409 if it has none pending; 404 if missing. */
  decide(target: PlanTarget, decision: ReportDecision): Promise<ReportDecisionResult>;
}
