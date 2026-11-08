import authRouter from "@/presentation/http/auth/routes/auth.route";

import profileRouter from "@/presentation/http/users/routes/profiles.routes";
import categoriesRouter from "@/presentation/http/categories/routes/categories.routes";
import provincesRouter from "@/presentation/http/geography/routes/provinces.routes";
import provinceCantonsRouter from "@/presentation/http/geography/routes/provinceCantons.routes";
import cantonsRouter from "@/presentation/http/geography/routes/cantons.routes";
import sourcesRouter from "@/presentation/http/sources/routes/sources.routes";
import placesRouter from "@/presentation/http/places/routes/places.routes";
import { eventFavoriteRouter, placeFavoriteRouter } from "@/presentation/http/favorites/routes/targetFavorite.routes";
import { eventReviewsRouter, placeReviewsRouter } from "@/presentation/http/reviews/routes/targetReviews.routes";
import reviewsRouter from "@/presentation/http/reviews/routes/reviews.routes";
import eventsRouter from "@/presentation/http/events/routes/events.routes";
import { eventCommunityRouter, placeCommunityRouter, reportsRouter } from "@/presentation/http/community/routes/community.routes";
import usersRouter from "@/presentation/http/users/routes/users.routes";
import mySubmissionsRouter from "@/presentation/http/submissions/routes/mySubmissions.routes";
import myDevicesRouter from "@/presentation/http/devices/routes/myDevices.routes";
import myNotificationsRouter from "@/presentation/http/notifications/routes/myNotifications.routes";
import submissionsRouter from "@/presentation/http/submissions/routes/submissions.routes";
import systemRouter from "@/presentation/http/system/routes/system.route";
import uploadsRouter from "@/presentation/http/uploads/routes/uploads.routes";
import filesRouter from "@/presentation/http/uploads/routes/files.routes";
import photosRouter from "@/presentation/http/photos/routes/photos.routes";
import { eventPhotosRouter, placePhotosRouter } from "@/presentation/http/photos/routes/galleryRouter";
import { Router } from "express";
const router = Router();

// user routes
router.use("/auth", authRouter);
// Before /me so profileRouter never handles these sub-resources.
router.use("/me/submissions", mySubmissionsRouter);
router.use("/me/devices", myDevicesRouter);
router.use("/me/notifications", myNotificationsRouter);
router.use('/me', profileRouter);
router.use("/categories", categoriesRouter);
// Before /provinces so the cantons sub-resource is never shadowed.
router.use("/provinces/:provinceId/cantons", provinceCantonsRouter);
router.use("/provinces", provincesRouter);
router.use("/cantons", cantonsRouter);
router.use("/sources", sourcesRouter);
// Before /places so the favorite, photos and reviews sub-resources are never shadowed.
router.use("/places/:placeId/favorite", placeFavoriteRouter);
router.use("/places/:placeId/photos", placePhotosRouter);
router.use("/places/:placeId/reviews", placeReviewsRouter);
router.use("/places/:placeId", placeCommunityRouter);
router.use("/places", placesRouter);
// Before /events so the favorite, photos and reviews sub-resources are never shadowed.
router.use("/events/:eventId/favorite", eventFavoriteRouter);
router.use("/events/:eventId/photos", eventPhotosRouter);
router.use("/events/:eventId/reviews", eventReviewsRouter);
router.use("/events/:eventId", eventCommunityRouter);
router.use("/events", eventsRouter);
router.use("/photos", photosRouter);
router.use("/reviews", reviewsRouter);
router.use("/reports", reportsRouter);
router.use("/uploads", uploadsRouter);
router.use("/files", filesRouter);
router.use("/users", usersRouter);
router.use("/submissions", submissionsRouter);
router.use("/system", systemRouter);


export default router;