import { ReportReason } from "../valueObjects/reportReason.valueObject";

/** Reports with the same reason that hide a plan while moderators review it (app: `REPORTS_TO_HIDE`). */
export const REPORTS_TO_HIDE = 3;
/** Hidden by reports for longer than this without a decision → "Necesita revisión" (app: `NEEDS_REVIEW_HOURS`). */
export const NEEDS_REVIEW_HOURS = 72;

export const HIDDEN_REASON_REPORTED = "En revisión por reportes";
export const HIDDEN_REASON_MODERATION = "Ocultada por moderación";

export const REPORT_DECISIONS = ["keep", "hide"] as const;
export type ReportDecision = (typeof REPORT_DECISIONS)[number];

/** Port of the app's `reportsHide`: the most repeated reason decides; 3 of them hide the plan. */
export function reportsHide(reasons: ReportReason[]): { hide: boolean; topReason: ReportReason | null; count: number } {
  const counts = new Map<ReportReason, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  let topReason: ReportReason | null = null;
  let top = 0;
  for (const [reason, n] of counts) {
    if (n > top) {
      topReason = reason;
      top = n;
    }
  }
  return { hide: top >= REPORTS_TO_HIDE, topReason, count: reasons.length };
}

/** True when a plan has been hidden by reports for more than 72 h without a moderator's decision. */
export function needsReview(reportedAt: Date | null, now: Date): boolean {
  if (!reportedAt) return false;
  return now.getTime() - reportedAt.getTime() > NEEDS_REVIEW_HOURS * 60 * 60 * 1000;
}
