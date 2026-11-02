import { Router } from "express";
import { cantonController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { intParam } from "@/presentation/http/core/validators/params";
import { ListCantonsQuerySchema } from "../validators/listCantons";

// Mounted at /provinces/:provinceId/cantons (before /provinces in router.ts), so `mergeParams`
// is required to see `provinceId`.
const provinceCantonsRouter = Router({ mergeParams: true });

// Public read (cacheable)
provinceCantonsRouter.get(
  "/",
  validateSchema(intParam("provinceId"), "params"),
  validateSchema(ListCantonsQuerySchema, "query"),
  asyncHandler(cantonController.listByProvince.bind(cantonController)),
);

export default provinceCantonsRouter;
