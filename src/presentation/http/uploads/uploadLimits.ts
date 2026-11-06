/**
 * Upload limits. Kept apart from the routes so the OpenAPI document can show them without
 * loading the DI container.
 */
export const UPLOAD_FIELD_NAME = "file";
/** Maximum size of the file as sent by the client (before re-encoding). */
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
/** Per authenticated user: enough for several 5-photo submissions in a row. */
export const UPLOAD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 60 };
export const UPLOAD_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
