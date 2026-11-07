import { Router } from "express";
import { reviewController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import { ListReviewsQuerySchema } from "../validators/listReviews";
import { CreateReviewSchema } from "../validators/reviewBody";

// Mounted at /places/:placeId/reviews (before /places), so `mergeParams` is required to see `placeId`.
const placeReviewsRouter = Router({ mergeParams: true });
const params = validateSchema(uuidParam("placeId"), "params");

// Public (optional auth: moderators/admins can also list the reviews of an unpublished place).
placeReviewsRouter.get("/", optionalJwtAuth, params, validateSchema(ListReviewsQuerySchema, "query"), asyncHandler(reviewController.listForPlace.bind(reviewController)));
placeReviewsRouter.post("/", jwtAuth, params, validateSchema(CreateReviewSchema), asyncHandler(reviewController.create.bind(reviewController)));

export default placeReviewsRouter;
