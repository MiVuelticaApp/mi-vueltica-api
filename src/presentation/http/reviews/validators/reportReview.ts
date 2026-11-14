import z from "zod";
import { REPORT_DETAILS_MAX_LENGTH } from "@/domain/community/valueObjects/reportReason.valueObject";
import { REVIEW_REPORT_REASONS } from "@/domain/reviews/rules/reviewReportRules";

/** `POST /reviews/:id/reports`. */
export const ReportReviewSchema = z.object({
  reason: z.enum(REVIEW_REPORT_REASONS, { error: `reason debe ser uno de: ${REVIEW_REPORT_REASONS.join(", ")}` }),
  details: z
    .string({ error: "details debe ser texto" })
    .trim()
    .max(REPORT_DETAILS_MAX_LENGTH, { message: `details no puede exceder ${REPORT_DETAILS_MAX_LENGTH} caracteres` })
    .nullable()
    .optional(),
});

export type ReportReviewRequest = z.output<typeof ReportReviewSchema>;
