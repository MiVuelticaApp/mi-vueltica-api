import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { REVIEW_SORT_FIELDS } from "@/domain/reviews/repositories/IReviewRepository";
import { REVIEW_AUDIENCES } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";

export { REVIEW_SORT_FIELDS };

/** GET /me/reviews — newest first by default. */
export const ListReviewsQuerySchema = createPaginationQuerySchema(REVIEW_SORT_FIELDS);

/** GET /places/:placeId/reviews and GET /events/:eventId/reviews — newest first by default. */
export const ListTargetReviewsQuerySchema = createPaginationQuerySchema(REVIEW_SORT_FIELDS).extend({
  audience: z.enum(REVIEW_AUDIENCES, { error: `audience debe ser uno de: ${REVIEW_AUDIENCES.join(", ")}` }).optional(),
  // `"true"` / `"false"` (`z.coerce.boolean()` would turn `"false"` into `true`).
  withPhotos: z
    .enum(["true", "false"], { error: "withPhotos debe ser true o false" })
    .transform((value) => value === "true")
    .optional(),
});

/** GET /reviews — moderation queue (PENDING and oldest first by default). */
export const ListReviewQueueQuerySchema = createPaginationQuerySchema(REVIEW_SORT_FIELDS).extend({
  status: z.enum(CONTENT_STATUSES, { error: `status debe ser uno de: ${CONTENT_STATUSES.join(", ")}` }).default("PENDING"),
  placeId: z.uuid({ error: "placeId debe ser un UUID válido" }).optional(),
  eventId: z.uuid({ error: "eventId debe ser un UUID válido" }).optional(),
});
