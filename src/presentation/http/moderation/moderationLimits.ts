/** Votes and undos per user (kept apart from the routes so the OpenAPI document can show it). */
export const MODERATION_VOTE_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 60 };
