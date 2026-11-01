import authRouter from "@/presentation/auth/routes/auth.route";

import profileRouter from "@/presentation/users/routes/profiles.routes";
import categoriesRouter from "@/presentation/categories/routes/categories.routes";
import usersRouter from "@/presentation/users/routes/users.routes";
import systemRouter from "@/presentation/system/routes/system.route";
import { Router } from "express";
const router = Router();

// user routes
router.use("/auth", authRouter);
router.use('/me', profileRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/system", systemRouter);


export default router;