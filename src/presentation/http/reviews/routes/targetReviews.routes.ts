import { Router } from "express";
import { reviewController } from "@/dependencyInjection/container";
import { ReviewTargetType } from "@/domain/reviews/valueObjects/reviewTarget.valueObject";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import { REVIEW_TARGET_PARAMS } from "../controllers/Review.controller";
import { ListTargetReviewsQuerySchema } from "../validators/listReviews";
import { CreateReviewSchema } from "../validators/reviewBody";

/**
 * Router for `/places/:placeId/reviews` or `/events/:eventId/reviews` (mounted before the parent
 * router in router.ts; `mergeParams` is required to see the place / event id).
 */
export function createTargetReviewsRouter(type: ReviewTargetType): Router {
  const router = Router({ mergeParams: true });
  const handlers = reviewController.target(type);
  const params = validateSchema(uuidParam(REVIEW_TARGET_PARAMS[type]), "params");

  // Public (optional auth: the author also sees their own PENDING review and `markedUsefulByMe`;
  // moderators/admins can list the reviews of unpublished content).
  router.get("/", optionalJwtAuth, params, validateSchema(ListTargetReviewsQuerySchema, "query"), asyncHandler(handlers.list));
  router.post("/", jwtAuth, params, validateSchema(CreateReviewSchema), asyncHandler(handlers.create));

  return router;
}

export const placeReviewsRouter = createTargetReviewsRouter("PLACE");
export const eventReviewsRouter = createTargetReviewsRouter("EVENT");
