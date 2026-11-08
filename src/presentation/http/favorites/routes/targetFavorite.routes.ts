import { Router } from "express";
import { favoriteController } from "@/dependencyInjection/container";
import { FavoriteType } from "@/domain/favorites/entities/FavoriteItem";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { FAVORITE_TARGET_PARAMS } from "../controllers/Favorite.controller";

/**
 * Router for `/places/:placeId/favorite` or `/events/:eventId/favorite` (mounted before the parent
 * router in router.ts; `mergeParams` is required to see the place / event id).
 */
export function createTargetFavoriteRouter(type: FavoriteType): Router {
  const router = Router({ mergeParams: true });
  const handlers = favoriteController.target(type);

  router.use(jwtAuth, validateSchema(uuidParam(FAVORITE_TARGET_PARAMS[type]), "params"));
  router.put("/", asyncHandler(handlers.add));
  router.delete("/", asyncHandler(handlers.remove));

  return router;
}

export const placeFavoriteRouter = createTargetFavoriteRouter("PLACE");
export const eventFavoriteRouter = createTargetFavoriteRouter("EVENT");
