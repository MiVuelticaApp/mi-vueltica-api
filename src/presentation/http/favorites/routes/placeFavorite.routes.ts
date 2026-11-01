import { Router } from "express";
import { favoriteController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParam } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";

// Mounted at /places/:placeId/favorite, so `mergeParams` is required to see `placeId`.
const placeFavoriteRouter = Router({ mergeParams: true });

placeFavoriteRouter.use(jwtAuth, validateSchema(uuidParam("placeId"), "params"));
placeFavoriteRouter.put("/", asyncHandler(favoriteController.add.bind(favoriteController)));
placeFavoriteRouter.delete("/", asyncHandler(favoriteController.remove.bind(favoriteController)));

export default placeFavoriteRouter;
