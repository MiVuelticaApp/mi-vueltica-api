import { Router } from "express";
import { reviewController } from "@/dependencyInjection/container";
import { USER_ROLES } from "@/domain/users/entities/User";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListReviewQueueQuerySchema } from "../validators/listReviews";
import { UpdateReviewSchema } from "../validators/reviewBody";
import { ChangeReviewStatusSchema } from "../validators/changeReviewStatus";
import { ReportReviewSchema } from "../validators/reportReview";
import rateLimit, { byUserId } from "@/presentation/http/core/middlewares/rateLimit";
import { REPORT_RATE_LIMIT } from "@/presentation/http/community/communityLimits";

const reviewsRouter = Router();
const moderator = [jwtAuth, requireRole("MODERATOR", "ADMIN")];
const idParams = validateSchema(uuidParamSchema, "params");

// Moderation queue
reviewsRouter.get("/", ...moderator, validateSchema(ListReviewQueueQuerySchema, "query"), asyncHandler(reviewController.list.bind(reviewController)));
reviewsRouter.patch("/:id/status", ...moderator, idParams, validateSchema(ChangeReviewStatusSchema), asyncHandler(reviewController.changeStatus.bind(reviewController)));

// "Útil" votes (any authenticated user, not on their own review; idempotent).
reviewsRouter.post("/:id/useful", jwtAuth, idParams, asyncHandler(reviewController.markUseful.bind(reviewController)));
reviewsRouter.delete("/:id/useful", jwtAuth, idParams, asyncHandler(reviewController.unmarkUseful.bind(reviewController)));

// Reports (#16): signed-in users only, same rate limit as plan reports; 3 send the review back to PENDING.
reviewsRouter.post(
  "/:id/reports",
  jwtAuth,
  rateLimit({ ...REPORT_RATE_LIMIT, keyGenerator: byUserId }),
  idParams,
  validateSchema(ReportReviewSchema),
  asyncHandler(reviewController.report.bind(reviewController)),
);

// Author edit (ownership is checked by the service).
reviewsRouter.put("/:id", jwtAuth, idParams, validateSchema(UpdateReviewSchema), asyncHandler(reviewController.update.bind(reviewController)));
// Author or moderator. `requireRole` with every role loads the caller's role from the database
// (and rejects soft-deleted users); the service then decides owner vs. moderator.
reviewsRouter.delete("/:id", jwtAuth, requireRole(...USER_ROLES), idParams, asyncHandler(reviewController.delete.bind(reviewController)));

export default reviewsRouter;
