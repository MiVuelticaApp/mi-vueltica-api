import { Router } from "express";
import { categoryController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { intIdParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListCategoriesQuerySchema } from "../validators/listCategories";
import { CreateCategorySchema } from "../validators/createCategory";
import { UpdateCategorySchema } from "../validators/updateCategory";

const categoriesRouter = Router();

// Public reads
categoriesRouter.get("/", validateSchema(ListCategoriesQuerySchema, "query"), asyncHandler(categoryController.list.bind(categoryController)));
categoriesRouter.get("/:id", validateSchema(intIdParamSchema, "params"), asyncHandler(categoryController.get.bind(categoryController)));

// Admin writes
categoriesRouter.post("/", jwtAuth, requireRole("ADMIN"), validateSchema(CreateCategorySchema), asyncHandler(categoryController.create.bind(categoryController)));
categoriesRouter.put("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), validateSchema(UpdateCategorySchema), asyncHandler(categoryController.update.bind(categoryController)));
categoriesRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(intIdParamSchema, "params"), asyncHandler(categoryController.delete.bind(categoryController)));

export default categoriesRouter;
