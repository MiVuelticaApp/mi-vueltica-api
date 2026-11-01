import { Router } from "express";
import { adminUsersController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import { ListUsersQuerySchema } from "../validators/listUsers";
import { ChangeUserRoleSchema } from "../validators/changeUserRole";

const usersRouter = Router();

usersRouter.use(jwtAuth, requireRole("ADMIN"));

usersRouter.get("/", validateSchema(ListUsersQuerySchema, "query"), asyncHandler(adminUsersController.list.bind(adminUsersController)));
usersRouter.get("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(adminUsersController.get.bind(adminUsersController)));
usersRouter.patch(
  "/:id/role",
  validateSchema(uuidParamSchema, "params"),
  validateSchema(ChangeUserRoleSchema),
  asyncHandler(adminUsersController.changeRole.bind(adminUsersController)),
);
usersRouter.delete("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(adminUsersController.delete.bind(adminUsersController)));

export default usersRouter;
