import { PlanStats } from "@/domain/core/plans/PlanStats";
import { PlanStatsResponse } from "../responses/PlanStatsResponse";

// Same rounding as the detail's `averageRating` (RatingSummaryDtoMapper).
const round2 = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

export const toPlanStatsResponse = (stats: PlanStats): PlanStatsResponse => ({
  averageRating: round2(stats.averageRating),
  reviewCount: stats.reviewCount,
  coverPhotoUrl: stats.coverPhotoUrl,
});
