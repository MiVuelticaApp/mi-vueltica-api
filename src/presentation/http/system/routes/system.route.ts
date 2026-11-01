import { Router } from "express";
import asyncHandler from "@/presentation/core/handlers/asyncHandler";
import { systemController } from "@/dependencyInjection/container";

const systemRouter = Router();

// ==================== PUBLIC ====================
// No jwtAuth: the client must be able to check the minimum supported
// frontend version before it has a token (to decide whether to force an update instead of
// logging in).
systemRouter.get(
  "/min-frontend-version",
  asyncHandler(systemController.minFrontendVersion.bind(systemController)),
);

export default systemRouter;