/** Rating fields of place / event detail responses (over PUBLISHED reviews only). */
export interface RatingFieldsResponse {
  /** Mean rating rounded to 2 decimals; null when there are no reviews. */
  averageRating: number | null;
  reviewCount: number;
  /** Reviews per star: index 0 = 1 star ... index 4 = 5 stars. */
  ratingDistribution: number[];
}

/** `summary` of the reviews list of a place or event. */
export interface RatingSummaryResponse {
  averageRating: number | null;
  reviewCount: number;
  /** Reviews per star: index 0 = 1 star ... index 4 = 5 stars. */
  distribution: number[];
}
