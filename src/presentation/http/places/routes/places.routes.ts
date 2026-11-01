import { Router } from "express";
import { placeController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListPlacesQuerySchema } from "../validators/listPlaces";
import { CreatePlaceSchema } from "../validators/createPlace";
import { UpdatePlaceSchema } from "../validators/updatePlace";
import { ChangePlaceStatusSchema } from "../validators/changePlaceStatus";

const placesRouter = Router();

// Public reads (optional auth: moderators/admins also see unpublished places)
placesRouter.get("/", optionalJwtAuth, validateSchema(ListPlacesQuerySchema, "query"), asyncHandler(placeController.list.bind(placeController)));
placesRouter.get("/:id", optionalJwtAuth, validateSchema(uuidParamSchema, "params"), asyncHandler(placeController.get.bind(placeController)));

// Moderator/admin writes
placesRouter.post("/", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(CreatePlaceSchema), asyncHandler(placeController.create.bind(placeController)));
placesRouter.put("/:id", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), validateSchema(UpdatePlaceSchema), asyncHandler(placeController.update.bind(placeController)));
placesRouter.patch("/:id/status", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), validateSchema(ChangePlaceStatusSchema), asyncHandler(placeController.changeStatus.bind(placeController)));

// Admin delete
placesRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(uuidParamSchema, "params"), asyncHandler(placeController.delete.bind(placeController)));

export default placesRouter;
