/** What a list card shows besides the place/event fields (places and events lists, saved items, MCP lists). */
export interface PlanStatsResponse {
  /** Mean of the PUBLISHED reviews, rounded to 2 decimals; null when there are none. */
  averageRating: number | null;
  /** Number of PUBLISHED reviews. */
  reviewCount: number;
  /** First gallery photo (the card's thumbnail); null without photos. */
  coverPhotoUrl: string | null;
}
