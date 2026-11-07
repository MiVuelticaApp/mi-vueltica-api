import z from "zod";
import { MAX_RATING, MIN_RATING } from "@/domain/reviews/valueObjects/rating.valueObject";
import { REVIEW_COMMENT_MAX_LENGTH } from "@/domain/reviews/valueObjects/reviewComment.valueObject";
import { SPENT_TIERS, WENT_WITH_VALUES } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { REVIEW_MAX_PHOTOS } from "@/domain/reviews/valueObjects/reviewPhotos.valueObject";

const ratingMessage = `La calificación debe ser un número entero entre ${MIN_RATING} y ${MAX_RATING}`;

/**
 * Body of `POST /places/:placeId/reviews`, `POST /events/:eventId/reviews` and `PUT /reviews/:id`
 * (full replace). Re-validated by the domain.
 */
export const ReviewBodySchema = z.object({
  rating: z
    .number({ error: ratingMessage })
    .int({ message: ratingMessage })
    .min(MIN_RATING, { message: ratingMessage })
    .max(MAX_RATING, { message: ratingMessage }),
  comment: z
    .string({ error: "El comentario debe ser texto" })
    .trim()
    .max(REVIEW_COMMENT_MAX_LENGTH, { message: `El comentario no puede exceder ${REVIEW_COMMENT_MAX_LENGTH} caracteres` })
    .nullable()
    .optional(),
  wentWith: z
    .enum(WENT_WITH_VALUES, { error: `wentWith debe ser uno de: ${WENT_WITH_VALUES.join(", ")}` })
    .nullable()
    .optional(),
  spent: z
    .enum(SPENT_TIERS, { error: `spent debe ser uno de: ${SPENT_TIERS.join(", ")}` })
    .nullable()
    .optional(),
  photos: z
    .array(z.string({ error: "Cada foto debe ser una URL" }).trim().min(1).max(2048), { error: "photos debe ser una lista de URLs" })
    .max(REVIEW_MAX_PHOTOS, { message: `Una reseña puede tener como máximo ${REVIEW_MAX_PHOTOS} fotos` })
    .refine((urls) => new Set(urls).size === urls.length, { message: "photos no puede repetir la misma foto" })
    .optional(),
});

export const CreateReviewSchema = ReviewBodySchema;
export const UpdateReviewSchema = ReviewBodySchema;
