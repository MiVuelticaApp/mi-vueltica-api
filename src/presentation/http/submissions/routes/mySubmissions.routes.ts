import { Router } from "express";
import { mySubmissionsController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import rateLimit, { byUserId } from "@/presentation/http/core/middlewares/rateLimit";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { CreateSubmissionSchema } from "../validators/createSubmission";
import { ListMySubmissionsQuerySchema } from "../validators/listSubmissions";
import { SUBMISSION_CREATE_RATE_LIMIT } from "../submissionLimits";

// Mounted at /me/submissions (before /me in router.ts).
const mySubmissionsRouter = Router();
mySubmissionsRouter.use(jwtAuth);

mySubmissionsRouter.post("/", rateLimit({ ...SUBMISSION_CREATE_RATE_LIMIT, keyGenerator: byUserId }), validateSchema(CreateSubmissionSchema), asyncHandler(mySubmissionsController.create.bind(mySubmissionsController)));
mySubmissionsRouter.get("/", validateSchema(ListMySubmissionsQuerySchema, "query"), asyncHandler(mySubmissionsController.list.bind(mySubmissionsController)));
mySubmissionsRouter.get("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(mySubmissionsController.get.bind(mySubmissionsController)));
mySubmissionsRouter.delete("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(mySubmissionsController.delete.bind(mySubmissionsController)));

export default mySubmissionsRouter;
