import { Router } from "express";
import { fileController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";

// Public: GET (and HEAD, which Express routes to the same handler).
const filesRouter = Router();

filesRouter.get("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(fileController.get.bind(fileController)));

export default filesRouter;
