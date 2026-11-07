import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { REVIEW_SORT_FIELDS } from "@/domain/reviews/repositories/IReviewRepository";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";

export { REVIEW_SORT_FIELDS };

/** GET /places/:placeId/reviews and GET /me/reviews — newest first by default. */
export const ListReviewsQuerySchema = createPaginationQuerySchema(REVIEW_SORT_FIELDS);

/** GET /reviews — moderation queue (PENDING and oldest first by default). */
export const ListReviewQueueQuerySchema = createPaginationQuerySchema(REVIEW_SORT_FIELDS).extend({
  status: z.enum(CONTENT_STATUSES, { error: `status debe ser uno de: ${CONTENT_STATUSES.join(", ")}` }).default("PENDING"),
  placeId: z.uuid({ error: "placeId debe ser un UUID válido" }).optional(),
});
