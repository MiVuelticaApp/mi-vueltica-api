import { PaginationParams } from "@/domain/core/pagination/Pagination";
import { PlanState } from "../entities/PlanState";
import { CountingVerification, VerificationSummary } from "../entities/Verification";
import { Report, ReportQueueItem } from "../entities/Report";
import { PaginatedResult } from "@/domain/core/pagination/Pagination";
import { PlanTarget } from "../valueObjects/planTarget.valueObject";
import { PricePaid, StillHappening } from "../valueObjects/verificationAnswers.valueObject";
import { ReportReason } from "../valueObjects/reportReason.valueObject";

/** Reads and changes the community state of a Place / Event. */
export interface IPlanStateRepository {
  /** Locks the Place / Event row (`SELECT ... FOR UPDATE`) for the rest of the transaction. Null if missing. */
  lock(target: PlanTarget): Promise<PlanState | null>;
  /** ARCHIVED with `reason`; `reportedAt` set when hidden by reports (waiting for a moderator), else null. */
  hide(target: PlanTarget, reason: string, reportedAt: Date | null): Promise<void>;
  /** PUBLISHED, clearing `hiddenReason` and `reportedAt`. */
  publish(target: PlanTarget): Promise<void>;
  setPrice(target: PlanTarget, pricePerPerson: number): Promise<void>;
  /** Places only (events have no `verifiedAt`): the community confirmed it is still on. */
  markVerified(target: PlanTarget, at: Date): Promise<void>;
}

/** A photo already resolved to one of the user's uploads. */
export interface CommunityPhoto {
  uploadId: string;
  url: string;
}

export interface SaveVerificationData {
  target: PlanTarget;
  personKey: string;
  userId: string | null;
  stillHappening: StillHappening;
  pricePaid: PricePaid | null;
  scheduleCorrect: boolean | null;
  correctedTime: string | null;
  photo: CommunityPhoto | null;
  now: Date;
}

export interface IVerificationRepository {
  /** Inserts, or replaces the same person's previous answer for the plan (which counts again). */
  save(data: SaveVerificationData): Promise<void>;
  /** Verifications that have not produced an outcome yet. */
  listCounting(target: PlanTarget): Promise<CountingVerification[]>;
  /** Marks the counting verifications as used by an outcome. */
  consumeAll(target: PlanTarget, at: Date): Promise<void>;
  /** `personKey` (the caller) is optional; `todayStart` is the start of the day for `myVerifiedToday`. */
  summary(target: PlanTarget, personKey: string | null, todayStart: Date): Promise<VerificationSummary>;
}

export interface CreateReportData {
  target: PlanTarget;
  personKey: string;
  userId: string | null;
  reason: ReportReason;
  details: string | null;
  photo: CommunityPhoto | null;
}

export interface ReportQueueOptions {
  /** Leaves out the plans this user is the author of (community voters). */
  excludeAuthorId?: string;
}

export interface IReportRepository {
  existsForPerson(target: PlanTarget, personKey: string): Promise<boolean>;
  /** A duplicate (target, person) fails with a P2002 cause (409). */
  create(data: CreateReportData): Promise<Report>;
  unresolvedReasons(target: PlanTarget): Promise<ReportReason[]>;
  /** Returns how many reports were resolved. */
  resolveAll(target: PlanTarget, at: Date): Promise<number>;
  /**
   * Plans with unresolved reports: the ones needing review first, then hidden ones, then by oldest
   * unresolved report. `now` decides `needsReview`.
   */
  queue(params: PaginationParams, now: Date, options?: ReportQueueOptions): Promise<PaginatedResult<ReportQueueItem>>;
}
