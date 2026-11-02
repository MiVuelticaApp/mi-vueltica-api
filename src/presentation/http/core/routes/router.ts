import authRouter from "@/presentation/http/auth/routes/auth.route";

import profileRouter from "@/presentation/http/users/routes/profiles.routes";
import categoriesRouter from "@/presentation/http/categories/routes/categories.routes";
import provincesRouter from "@/presentation/http/geography/routes/provinces.routes";
import provinceCantonsRouter from "@/presentation/http/geography/routes/provinceCantons.routes";
import cantonsRouter from "@/presentation/http/geography/routes/cantons.routes";
import sourcesRouter from "@/presentation/http/sources/routes/sources.routes";
import placesRouter from "@/presentation/http/places/routes/places.routes";
import placeFavoriteRouter from "@/presentation/http/favorites/routes/placeFavorite.routes";
import eventsRouter from "@/presentation/http/events/routes/events.routes";
import usersRouter from "@/presentation/http/users/routes/users.routes";
import mySubmissionsRouter from "@/presentation/http/submissions/routes/mySubmissions.routes";
import myDevicesRouter from "@/presentation/http/devices/routes/myDevices.routes";
import submissionsRouter from "@/presentation/http/submissions/routes/submissions.routes";
import systemRouter from "@/presentation/http/system/routes/system.route";
import { Router } from "express";
const router = Router();

// user routes
router.use("/auth", authRouter);
// Before /me so profileRouter never handles these sub-resources.
router.use("/me/submissions", mySubmissionsRouter);
router.use("/me/devices", myDevicesRouter);
router.use('/me', profileRouter);
router.use("/categories", categoriesRouter);
// Before /provinces so the cantons sub-resource is never shadowed.
router.use("/provinces/:provinceId/cantons", provinceCantonsRouter);
router.use("/provinces", provincesRouter);
router.use("/cantons", cantonsRouter);
router.use("/sources", sourcesRouter);
// Before /places so the favorite sub-resource is never shadowed.
router.use("/places/:placeId/favorite", placeFavoriteRouter);
router.use("/places", placesRouter);
router.use("/events", eventsRouter);
router.use("/users", usersRouter);
router.use("/submissions", submissionsRouter);
router.use("/system", systemRouter);


export default router;