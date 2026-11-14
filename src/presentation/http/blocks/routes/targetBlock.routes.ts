import { Router } from "express";
import { blockController } from "@/dependencyInjection/container";
import { BlockTarget } from "@/domain/blocks/entities/BlockedUser";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { BLOCK_TARGET_PARAMS } from "../controllers/Block.controller";

/**
 * Router for `POST /places/:placeId/author/block`, `/events/:eventId/author/block` or
 * `/reviews/:reviewId/author/block` (mounted before the parent router in router.ts; `mergeParams` is required to
 * see the target id).
 */
export function createTargetBlockRouter(type: BlockTarget["type"]): Router {
  const router = Router({ mergeParams: true });
  const handlers = blockController.target(type);

  router.use(jwtAuth, validateSchema(uuidParam(BLOCK_TARGET_PARAMS[type]), "params"));
  router.post("/", asyncHandler(handlers.block));

  return router;
}

export const placeBlockRouter = createTargetBlockRouter("PLACE");
export const eventBlockRouter = createTargetBlockRouter("EVENT");
export const reviewBlockRouter = createTargetBlockRouter("REVIEW");
