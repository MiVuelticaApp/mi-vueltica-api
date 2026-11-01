import { Router } from "express";
import { mcpController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";

const mcpRouter = Router();

mcpRouter.post(
  "/",
  jwtAuth,
  requireRole("MODERATOR", "ADMIN"),
  asyncHandler(mcpController.handle.bind(mcpController)),
);
mcpRouter.get("/", mcpController.methodNotAllowed.bind(mcpController));
mcpRouter.delete("/", mcpController.methodNotAllowed.bind(mcpController));

export default mcpRouter;
