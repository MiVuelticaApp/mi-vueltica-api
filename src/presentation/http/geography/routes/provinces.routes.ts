import { Router } from "express";
import { provinceController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { intIdParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListProvincesQuerySchema } from "../validators/listProvinces";
import { CreateProvinceSchema } from "../validators/createProvince";
import { UpdateProvinceSchema } from "../validators/updateProvince";

const provincesRouter = Router();

// Public reads (cacheable)
provincesRouter.get("/", validateSchema(ListProvincesQuerySchema, "query"), asyncHandler(provinceController.list.bind(provinceController)));
provincesRouter.get("/:id", validateSchema(intIdParamSchema, "params"), asyncHandler(provinceController.get.bind(provinceController)));

// Admin writes
provincesRouter.post("/", jwtAuth, requireRole("ADMIN"), validateSchema(CreateProvinceSchema), asyncHandler(provinceController.create.bind(provinceController)));
provincesRouter.put("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), validateSchema(UpdateProvinceSchema), asyncHandler(provinceController.update.bind(provinceController)));
provincesRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), asyncHandler(provinceController.delete.bind(provinceController)));

export default provincesRouter;
