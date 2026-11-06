import { Router } from "express";
import { uploadController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import rateLimit, { byUserId } from "@/presentation/http/core/middlewares/rateLimit";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import singleFileUpload from "../middlewares/singleFileUpload";
import { UPLOAD_RATE_LIMIT } from "../uploadLimits";

const uploadsRouter = Router();

// Rate limit before parsing so a throttled client does not even get its body buffered.
uploadsRouter.post(
  "/",
  jwtAuth,
  rateLimit({ ...UPLOAD_RATE_LIMIT, keyGenerator: byUserId }),
  singleFileUpload,
  asyncHandler(uploadController.create.bind(uploadController)),
);

export default uploadsRouter;
