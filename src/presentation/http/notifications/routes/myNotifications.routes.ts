import { Router } from "express";
import { myNotificationsController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { ListNotificationsQuerySchema } from "../validators/listNotifications";

// Mounted at /me/notifications (before /me in router.ts). Notifications are created internally
// (NotificationService.notify), so there is no POST.
const myNotificationsRouter = Router();
myNotificationsRouter.use(jwtAuth);

myNotificationsRouter.get("/", validateSchema(ListNotificationsQuerySchema, "query"), asyncHandler(myNotificationsController.list.bind(myNotificationsController)));
myNotificationsRouter.delete("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(myNotificationsController.delete.bind(myNotificationsController)));

export default myNotificationsRouter;
