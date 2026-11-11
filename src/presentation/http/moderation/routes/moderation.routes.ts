import { Router } from "express";
import { moderationController } from "@/dependencyInjection/container";
import { USER_ROLES } from "@/domain/users/entities/User";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import rateLimit, { byUserId } from "@/presentation/http/core/middlewares/rateLimit";
import { uuidParam, uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { VoteSchema } from "../validators/vote";
import { MODERATION_VOTE_RATE_LIMIT } from "../moderationLimits";

/**
 * Community moderation (#43). Any signed-in role reaches the routes (`requireRole` only loads the role from
 * the database); the services decide who may vote: level 3+ by reputation, or MODERATOR / ADMIN.
 */
const moderationRouter = Router();
moderationRouter.use(jwtAuth, requireRole(...USER_ROLES));
const voteLimit = rateLimit({ ...MODERATION_VOTE_RATE_LIMIT, keyGenerator: byUserId });
const submissionParams = validateSchema(uuidParamSchema, "params");
const placeParams = validateSchema(uuidParam("placeId"), "params");
const eventParams = validateSchema(uuidParam("eventId"), "params");
const place = moderationController.plan("PLACE");
const event = moderationController.plan("EVENT");

moderationRouter.get("/queue", asyncHandler(moderationController.queue.bind(moderationController)));
moderationRouter.post(
  "/submissions/:id/vote",
  voteLimit,
  submissionParams,
  validateSchema(VoteSchema),
  asyncHandler(moderationController.voteSubmission.bind(moderationController)),
);
moderationRouter.delete(
  "/submissions/:id/vote",
  voteLimit,
  submissionParams,
  asyncHandler(moderationController.undoSubmissionVote.bind(moderationController)),
);
moderationRouter.post("/places/:placeId/vote", voteLimit, placeParams, validateSchema(VoteSchema), asyncHandler(place.vote));
moderationRouter.delete("/places/:placeId/vote", voteLimit, placeParams, asyncHandler(place.undo));
moderationRouter.post("/events/:eventId/vote", voteLimit, eventParams, validateSchema(VoteSchema), asyncHandler(event.vote));
moderationRouter.delete("/events/:eventId/vote", voteLimit, eventParams, asyncHandler(event.undo));

export default moderationRouter;
