import { Router } from "express";
import { photoController } from "@/dependencyInjection/container";
import { PhotoOwnerType } from "@/domain/photos/valueObjects/photoOwner.valueObject";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { GALLERY_OWNER_PARAMS } from "../controllers/Photo.controller";
import { AddPhotoSchema } from "../validators/addPhoto";
import { ReorderPhotosSchema } from "../validators/reorderPhotos";

/**
 * Router for `/places/:placeId/photos` or `/events/:eventId/photos` (mounted before the
 * parent router in router.ts; `mergeParams` is required to see the owner id).
 */
export function createGalleryRouter(type: PhotoOwnerType): Router {
  const router = Router({ mergeParams: true });
  const handlers = photoController.gallery(type);
  const params = validateSchema(uuidParam(GALLERY_OWNER_PARAMS[type]), "params");
  const moderator = [jwtAuth, requireRole("MODERATOR", "ADMIN")];

  // Public read (optional auth: moderators/admins also see galleries of unpublished content).
  router.get("/", optionalJwtAuth, params, asyncHandler(handlers.list));
  router.post("/", ...moderator, params, validateSchema(AddPhotoSchema), asyncHandler(handlers.add));
  router.patch("/order", ...moderator, params, validateSchema(ReorderPhotosSchema), asyncHandler(handlers.reorder));

  return router;
}

export const placePhotosRouter = createGalleryRouter("PLACE");
export const eventPhotosRouter = createGalleryRouter("EVENT");
