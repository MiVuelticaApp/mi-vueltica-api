import z from "zod";
import { MAX_RATING, MIN_RATING } from "@/domain/reviews/valueObjects/rating.valueObject";
import { REVIEW_COMMENT_MAX_LENGTH } from "@/domain/reviews/valueObjects/reviewComment.valueObject";

const ratingMessage = `La calificación debe ser un número entero entre ${MIN_RATING} y ${MAX_RATING}`;

/** Body of `POST /places/:placeId/reviews` and `PUT /reviews/:id` (full replace). Re-validated by the domain. */
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
});

export const CreateReviewSchema = ReviewBodySchema;
export const UpdateReviewSchema = ReviewBodySchema;
