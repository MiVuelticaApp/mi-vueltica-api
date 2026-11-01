import validateSchema from "@/presentation/core/middlewares/validateSchema";
import { Router } from "express";
import { UpdateUserSchema } from "../validators/updateUser";
import { DeleteAccountSchema } from "../validators/deleteAccount";
import { UpdateInterestsSchema } from "../validators/updateInterests";
import { myProfileController, myInterestsController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/core/handlers/asyncHandler";
import jwtAuth from "@/presentation/auth/middlewares/jwtAuth";
import rateLimit from "@/presentation/core/middlewares/rateLimit";

const profileRouter = Router();

profileRouter.use(jwtAuth);
profileRouter.put("/", validateSchema(UpdateUserSchema), asyncHandler(myProfileController.update.bind(myProfileController)));
profileRouter.get("/", asyncHandler(myProfileController.me.bind(myProfileController)));
profileRouter.get("/interests", asyncHandler(myInterestsController.list.bind(myInterestsController)));
profileRouter.put("/interests", validateSchema(UpdateInterestsSchema), asyncHandler(myInterestsController.replace.bind(myInterestsController)));
// Destructive: tighter limiter than /auth/qa (5 per 15 min per IP). The optional
// appleAuthorizationCode body field is accepted but consumed by the Apple account
// closure follow-up (#43); it is unused here.
profileRouter.post(
  "/",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateSchema(DeleteAccountSchema),
  asyncHandler(myProfileController.deleteAccount.bind(myProfileController)),
);

export default profileRouter;
