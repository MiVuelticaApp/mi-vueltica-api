import { MAX_RATING } from "../valueObjects/rating.valueObject";

/** Aggregated over PUBLISHED reviews only. */
export interface RatingSummary {
  /** Mean rating; null when there are no reviews. */
  average: number | null;
  count: number;
  /** Number of reviews per star: index 0 = 1 star ... index 4 = 5 stars. */
  distribution: number[];
}

/** Builds the summary from per-star counts (`{ rating, count }`, any order, missing stars = 0). */
export function buildRatingSummary(groups: { rating: number; count: number }[]): RatingSummary {
  const distribution: number[] = Array.from({ length: MAX_RATING }, () => 0);
  let count = 0;
  let sum = 0;
  for (const group of groups) {
    if (group.rating < 1 || group.rating > MAX_RATING) continue;
    distribution[group.rating - 1] += group.count;
    count += group.count;
    sum += group.rating * group.count;
  }
  return { average: count === 0 ? null : sum / count, count, distribution };
}
