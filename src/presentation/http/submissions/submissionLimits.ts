/**
 * Submission creation limit, per authenticated user. Kept apart from the routes so the
 * OpenAPI document can show it without loading the DI container. Raise `max` if a crawler
 * account needs more.
 */
export const SUBMISSION_CREATE_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 20 };
