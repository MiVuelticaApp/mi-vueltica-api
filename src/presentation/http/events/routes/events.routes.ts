import { Router } from "express";
import { eventController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import optionalJwtAuth from "@/presentation/http/auth/middlewares/optionalJwtAuth";
import requireRole from "@/presentation/http/auth/middlewares/requireRole";
import { ListEventsQuerySchema } from "../validators/listEvents";
import { CreateEventSchema } from "../validators/createEvent";
import { UpdateEventSchema } from "../validators/updateEvent";
import { ChangeEventStatusSchema } from "../validators/changeEventStatus";

const eventsRouter = Router();

// Public reads (optional auth: moderators/admins also see unpublished events)
eventsRouter.get("/", optionalJwtAuth, validateSchema(ListEventsQuerySchema, "query"), asyncHandler(eventController.list.bind(eventController)));
eventsRouter.get("/:id", optionalJwtAuth, validateSchema(uuidParamSchema, "params"), asyncHandler(eventController.get.bind(eventController)));

// Moderator/admin writes
eventsRouter.post("/", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(CreateEventSchema), asyncHandler(eventController.create.bind(eventController)));
eventsRouter.put("/:id", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), validateSchema(UpdateEventSchema), asyncHandler(eventController.update.bind(eventController)));
eventsRouter.patch("/:id/status", jwtAuth, requireRole("MODERATOR", "ADMIN"), validateSchema(uuidParamSchema, "params"), validateSchema(ChangeEventStatusSchema), asyncHandler(eventController.changeStatus.bind(eventController)));

// Admin delete
eventsRouter.delete("/:id", jwtAuth, requireRole("ADMIN"), validateSchema(uuidParamSchema, "params"), asyncHandler(eventController.delete.bind(eventController)));

export default eventsRouter;
