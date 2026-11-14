import { ReportReason } from "@/domain/community/valueObjects/reportReason.valueObject";

/** The plan reasons that make sense for a review (app: the review "Reportar" sheet). */
export const REVIEW_REPORT_REASONS = ["inapropiado", "spam", "otro"] as const satisfies readonly ReportReason[];
export type ReviewReportReason = (typeof REVIEW_REPORT_REASONS)[number];

/** Unresolved reports (any reason) that take a review off the public lists until a moderator decides. */
export const REVIEW_REPORTS_TO_HIDE = 3;

export function reviewReportsHide(unresolved: number): boolean {
  return unresolved >= REVIEW_REPORTS_TO_HIDE;
}
