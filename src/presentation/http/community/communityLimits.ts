/**
 * Per user (signed in) or per IP (guests). Kept apart from the routes so the OpenAPI document can show
 * them without loading the DI container. They blunt guests creating device ids to hide plans.
 */
export const VERIFICATION_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 30 };
export const REPORT_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 10 };
