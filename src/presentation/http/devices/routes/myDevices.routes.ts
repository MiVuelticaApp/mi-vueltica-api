import { Router } from "express";
import { myDevicesController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { RegisterDeviceSchema } from "../validators/registerDevice";
import { ListDevicesQuerySchema } from "../validators/listDevices";

// Mounted at /me/devices (before /me in router.ts).
const myDevicesRouter = Router();
myDevicesRouter.use(jwtAuth);

myDevicesRouter.get("/", validateSchema(ListDevicesQuerySchema, "query"), asyncHandler(myDevicesController.list.bind(myDevicesController)));
myDevicesRouter.post("/", validateSchema(RegisterDeviceSchema), asyncHandler(myDevicesController.register.bind(myDevicesController)));
myDevicesRouter.delete("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(myDevicesController.delete.bind(myDevicesController)));

export default myDevicesRouter;
