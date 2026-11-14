import { Router } from "express";
import { blockController } from "@/dependencyInjection/container";
import asyncHandler from "@/presentation/http/core/handlers/asyncHandler";
import validateSchema from "@/presentation/http/core/middlewares/validateSchema";
import { uuidParamSchema } from "@/presentation/http/core/validators/params";
import jwtAuth from "@/presentation/http/auth/middlewares/jwtAuth";
import { ListBlocksQuerySchema } from "../validators/listBlocks";

// Mounted at /me/blocks (before /me in router.ts).
const myBlocksRouter = Router();
myBlocksRouter.use(jwtAuth);

myBlocksRouter.get("/", validateSchema(ListBlocksQuerySchema, "query"), asyncHandler(blockController.list.bind(blockController)));
myBlocksRouter.delete("/:id", validateSchema(uuidParamSchema, "params"), asyncHandler(blockController.unblock.bind(blockController)));

export default myBlocksRouter;
