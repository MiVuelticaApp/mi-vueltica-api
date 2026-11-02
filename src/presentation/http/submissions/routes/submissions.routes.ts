import { Router } from "express";
import { submissionsController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListSubmissionsQuerySchema } from "../validators/listSubmissions";
import { RejectSubmissionSchema } from "../validators/rejectSubmission";

// Moderation queue: every route requires MODERATOR or ADMIN.
const submissionsRouter = Router();
submissionsRouter.use(jwtAuth, requireRole("MODERATOR", "ADMIN"));

submissionsRouter.get("/", validateSchema(ListSubmissionsQuerySchema, "query"), asyncHandler(submissionsController.list.bind(submissionsController)));
submissionsRouter.get("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(submissionsController.get.bind(submissionsController)));
submissionsRouter.post("/:id/approve", validateSchema(uuidParamSchema, "params"), asyncHandler(submissionsController.approve.bind(submissionsController)));
submissionsRouter.post("/:id/reject", validateSchema(uuidParamSchema, "params"), validateSchema(RejectSubmissionSchema), asyncHandler(submissionsController.reject.bind(submissionsController)));

export default submissionsRouter;
