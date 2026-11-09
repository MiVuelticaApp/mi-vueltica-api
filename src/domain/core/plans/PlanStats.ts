/**
 * What a list card shows about a Place or Event besides its own fields (the app's ActivityCard: stars,
 * review count and thumbnail). Only PUBLISHED reviews count, same as the detail's rating summary.
 */
export interface PlanStats {
  /** Mean rating of the PUBLISHED reviews; null when there are none. Not rounded (responses round to 2 decimals). */
  averageRating: number | null;
  reviewCount: number;
  /** URL of the first gallery photo (lowest `position`); null without photos. */
  coverPhotoUrl: string | null;
}

export const EMPTY_PLAN_STATS: PlanStats = { averageRating: null, reviewCount: 0, coverPhotoUrl: null };
