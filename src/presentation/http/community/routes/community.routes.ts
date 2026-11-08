import { Router } from "express";
import { communityController } from "@/dependencyInjection/container";
import { PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import rateLimit, { byUserId } from "@/presentation/http/core/middlewares/rateLimit";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { PLAN_TARGET_PARAMS } from "../controllers/Community.controller";
import { ReportDecisionSchema, ReportQueueQuerySchema, ReportSchema, VerifySchema } from "../validators/community";
import { REPORT_RATE_LIMIT, VERIFICATION_RATE_LIMIT } from "../communityLimits";

/**
 * `/places/:placeId` or `/events/:eventId` community sub-resources (mounted before the parent router in
 * router.ts; `mergeParams` is required to see the id): `POST verifications`, `POST reports` and
 * `POST reports/decision`.
 */
export function createPlanCommunityRouter(type: PlanTargetType): Router {
  const router = Router({ mergeParams: true });
  const handlers = communityController.plan(type);
  const params = validateSchema(uuidParam(PLAN_TARGET_PARAMS[type]), "params");
  // Guests may verify and report (deduplicated by `X-Device-Id`); signed-in users by user id.
  const verifyLimit = rateLimit({ ...VERIFICATION_RATE_LIMIT, keyGenerator: byUserId });
  const reportLimit = rateLimit({ ...REPORT_RATE_LIMIT, keyGenerator: byUserId });

  router.post("/verifications", optionalJwtAuth, verifyLimit, params, validateSchema(VerifySchema), asyncHandler(handlers.verify));
  router.post("/reports", optionalJwtAuth, reportLimit, params, validateSchema(ReportSchema), asyncHandler(handlers.report));
  router.post(
    "/reports/decision",
    jwtAuth,
    requireRole("MODERATOR", "ADMIN"),
    params,
    validateSchema(ReportDecisionSchema),
    asyncHandler(handlers.decide),
  );

  return router;
}

export const placeCommunityRouter = createPlanCommunityRouter("PLACE");
export const eventCommunityRouter = createPlanCommunityRouter("EVENT");

/** `GET /reports`: moderation queue of reported plans. */
export const reportsRouter = Router();
reportsRouter.get(
  "/",
  jwtAuth,
  requireRole("MODERATOR", "ADMIN"),
  validateSchema(ReportQueueQuerySchema, "query"),
  asyncHandler(communityController.queue.bind(communityController)),
);
