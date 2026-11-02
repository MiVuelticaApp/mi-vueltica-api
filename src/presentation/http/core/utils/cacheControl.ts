import { Response } from "express";

/** Default max-age for public, rarely changing reference data (provinces, cantons). */
export const REFERENCE_DATA_MAX_AGE_SECONDS = 60 * 60;

/**
 * Marks a successful response as cacheable by browsers and shared caches. Call it right before
 * sending a 200 so error responses (handled elsewhere) are never cached.
 */
export function setPublicCache(res: Response, maxAgeSeconds: number = REFERENCE_DATA_MAX_AGE_SECONDS): void {
  res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
}
