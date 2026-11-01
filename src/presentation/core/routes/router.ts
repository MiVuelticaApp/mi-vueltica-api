import authRouter from "@/presentation/auth/routes/auth.route";

import profileRouter from "@/presentation/users/routes/profiles.routes";
import categoriesRouter from "@/presentation/categories/routes/categories.routes";
import sourcesRouter from "@/presentation/sources/routes/sources.routes";
import placesRouter from "@/presentation/places/routes/places.routes";
import placeFavoriteRouter from "@/presentation/favorites/routes/placeFavorite.routes";
import usersRouter from "@/presentation/users/routes/users.routes";
import systemRouter from "@/presentation/system/routes/system.route";
import { Router } from "express";
const router = Router();

// user routes
router.use("/auth", authRouter);
router.use('/me', profileRouter);
router.use("/categories", categoriesRouter);
router.use("/sources", sourcesRouter);
// Before /places so the favorite sub-resource is never shadowed.
router.use("/places/:placeId/favorite", placeFavoriteRouter);
router.use("/places", placesRouter);
router.use("/users", usersRouter);
router.use("/system", systemRouter);


export default router;