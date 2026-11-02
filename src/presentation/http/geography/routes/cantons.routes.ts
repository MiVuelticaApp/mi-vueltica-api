import { Router } from "express";
import { cantonController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { intIdParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { CreateCantonSchema } from "../validators/createCanton";
import { UpdateCantonSchema } from "../validators/updateCanton";

// The list lives under /provinces/:provinceId/cantons (provinceCantons.routes.ts).
const cantonsRouter = Router();

// Public read (cacheable)
cantonsRouter.get("/:id", validateSchema(intIdParamSchema, "params"), asyncHandler(cantonController.get.bind(cantonController)));

// Admin writes
cantonsRouter.post("/", jwtAuth, requireRole("ADMIN"), validateSchema(CreateCantonSchema), asyncHandler(cantonController.create.bind(cantonController)));
cantonsRouter.put("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), validateSchema(UpdateCantonSchema), asyncHandler(cantonController.update.bind(cantonController)));
cantonsRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), asyncHandler(cantonController.delete.bind(cantonController)));

export default cantonsRouter;
