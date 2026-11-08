import { PaginatedResult } from "@/domain/core/pagination/Pagination";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { ReportReason } from "../valueObjects/reportReason.valueObject";
import { PlanTarget } from "../valueObjects/planTarget.valueObject";

/** A report as shown to moderators and to the reporter. The reporter is never exposed. */
export interface Report {
  id: string;
  target: PlanTarget;
  reason: ReportReason;
  details: string | null;
  photo: string | null;
  createdAt: Date;
}

/** One reported plan in the moderation queue (its unresolved reports). */
export interface ReportQueueItem {
  target: PlanTarget;
  /** Name of the place or title of the event. */
  title: string;
  status: ContentStatus;
  hiddenReason: string | null;
  /** Set while the plan is hidden by reports waiting for a decision. */
  reportedAt: Date | null;
  reportCount: number;
  topReason: ReportReason | null;
  /** Unresolved reports per reason. */
  reasons: Partial<Record<ReportReason, number>>;
  firstReportAt: Date;
  lastReportAt: Date;
  /** Hidden by reports for more than 72 h without a decision ("Necesita revisión"). */
  needsReview: boolean;
  /** Newest first. */
  reports: Report[];
}

export type ReportQueuePage = PaginatedResult<ReportQueueItem>;
