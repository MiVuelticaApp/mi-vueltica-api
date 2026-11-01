import { Router } from "express";
import { sourceController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListSourcesQuerySchema } from "../validators/listSources";
import { CreateSourceSchema } from "../validators/createSource";
import { UpdateSourceSchema } from "../validators/updateSource";

const sourcesRouter = Router();

// Moderator/admin reads
sourcesRouter.get("/", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(ListSourcesQuerySchema, "query"), asyncHandler(sourceController.list.bind(sourceController)));
sourcesRouter.get("/:id", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), asyncHandler(sourceController.get.bind(sourceController)));

// Admin writes
sourcesRouter.post("/", jwtAuth, requireRole("ADMIN"), validateSchema(CreateSourceSchema), asyncHandler(sourceController.create.bind(sourceController)));
sourcesRouter.put("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(uuidParamSchema, "params"), validateSchema(UpdateSourceSchema), asyncHandler(sourceController.update.bind(sourceController)));
sourcesRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(uuidParamSchema, "params"), asyncHandler(sourceController.delete.bind(sourceController)));

export default sourcesRouter;
