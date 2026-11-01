import authRouter from "@/presentation/http/auth/routes/auth.route";

import profileRouter from "@/presentation/http/users/routes/profiles.routes";
import categoriesRouter from "@/presentation/http/categories/routes/categories.routes";
import sourcesRouter from "@/presentation/http/sources/routes/sources.routes";
import placesRouter from "@/presentation/http/places/routes/places.routes";
import usersRouter from "@/presentation/http/users/routes/users.routes";
import systemRouter from "@/presentation/http/system/routes/system.route";
import { Router } from "express";
const router = Router();

// user routes
router.use("/auth", authRouter);
router.use('/me', profileRouter);
router.use("/categories", categoriesRouter);
router.use("/sources", sourcesRouter);
router.use("/places", placesRouter);
router.use("/users", usersRouter);
router.use("/system", systemRouter);


export default router;