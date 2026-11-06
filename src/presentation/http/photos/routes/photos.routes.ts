import { Router } from "express";
import { photoController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";

const photosRouter = Router();

photosRouter.delete("/:id", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), asyncHandler(photoController.delete.bind(photoController)));

export default photosRouter;
