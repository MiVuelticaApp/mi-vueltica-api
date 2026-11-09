import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { SUBMISSION_SORT_FIELDS } from "@/domain/submissions/repositories/ISubmissionRepository";
import { SUBMISSION_TYPES } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";

export { SUBMISSION_SORT_FIELDS };

/**
 * GET /me/submissions — the author's own submissions (newest first by default). `status` / `type` are optional
 * filters with no default, so without them every submission is listed (the app asks for `status=PENDING` to draw
 * its "Pendiente" pins).
 */
export const ListMySubmissionsQuerySchema = createPaginationQuerySchema(SUBMISSION_SORT_FIELDS).extend({
  status: z.enum(CONTENT_STATUSES, { error: `status debe ser uno de: ${CONTENT_STATUSES.join(", ")}` }).optional(),
  type: z.enum(SUBMISSION_TYPES, { error: `type debe ser uno de: ${SUBMISSION_TYPES.join(", ")}` }).optional(),
});

/** GET /submissions — moderation queue (PENDING and oldest first by default). */
export const ListSubmissionsQuerySchema = createPaginationQuerySchema(SUBMISSION_SORT_FIELDS).extend({
  status: z.enum(CONTENT_STATUSES, { error: `status debe ser uno de: ${CONTENT_STATUSES.join(", ")}` }).default("PENDING"),
  type: z.enum(SUBMISSION_TYPES, { error: `type debe ser uno de: ${SUBMISSION_TYPES.join(", ")}` }).optional(),
});
