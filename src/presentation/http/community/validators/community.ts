import z from "zod";
import {
  CORRECTED_TIME_MAX_LENGTH,
  PRICE_PAID_VALUES,
  STILL_HAPPENING_VALUES,
} from "@/domain/community/valueObjects/verificationAnswers.valueObject";
import { REPORT_DETAILS_MAX_LENGTH, REPORT_REASONS } from "@/domain/community/valueObjects/reportReason.valueObject";
import { REPORT_DECISIONS } from "@/domain/community/rules/reportRules";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";

const photoField = z
  .string({ error: "photo debe ser una URL" })
  .trim()
  .max(2048, { message: "photo no puede exceder 2048 caracteres" })
  .nullable()
  .optional();

/** `POST /places/:placeId/verifications` and `POST /events/:eventId/verifications` (app's `VerifyInput`). */
export const VerifySchema = z.object({
  stillHappening: z.enum(STILL_HAPPENING_VALUES, { error: `stillHappening debe ser uno de: ${STILL_HAPPENING_VALUES.join(", ")}` }),
  pricePaid: z
    .enum(PRICE_PAID_VALUES, { error: `pricePaid debe ser uno de: ${PRICE_PAID_VALUES.join(", ")}` })
    .nullable()
    .optional(),
  scheduleCorrect: z.boolean({ error: "scheduleCorrect debe ser verdadero o falso" }).nullable().optional(),
  correctedTime: z
    .string({ error: "correctedTime debe ser texto" })
    .trim()
    .max(CORRECTED_TIME_MAX_LENGTH, { message: `correctedTime no puede exceder ${CORRECTED_TIME_MAX_LENGTH} caracteres` })
    .nullable()
    .optional(),
  photo: photoField,
});

/** `POST /places/:placeId/reports` and `POST /events/:eventId/reports` (app's `ReportInput`). */
export const ReportSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: `reason debe ser uno de: ${REPORT_REASONS.join(", ")}` }),
  details: z
    .string({ error: "details debe ser texto" })
    .trim()
    .max(REPORT_DETAILS_MAX_LENGTH, { message: `details no puede exceder ${REPORT_DETAILS_MAX_LENGTH} caracteres` })
    .nullable()
    .optional(),
  photo: photoField,
});

/** `POST /places/:placeId/reports/decision` and the event equivalent (MODERATOR, ADMIN). */
export const ReportDecisionSchema = z.object({
  decision: z.enum(REPORT_DECISIONS, { error: `decision debe ser uno de: ${REPORT_DECISIONS.join(", ")}` }),
});

/** `GET /reports` — the queue has a fixed order, so no `sort`. */
export const ReportQueueQuerySchema = createPaginationQuerySchema(["createdAt"] as const).omit({ sort: true });
