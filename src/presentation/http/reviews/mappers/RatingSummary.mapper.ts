import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";
import { RatingFieldsResponse, RatingSummaryResponse } from "../responses/RatingSummaryResponse";

const round2 = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);

export default class RatingSummaryDtoMapper {
  /** Fields spread into the place / event detail responses. */
  static toDetailFields(summary: RatingSummary): RatingFieldsResponse {
    return {
      averageRating: round2(summary.average),
      reviewCount: summary.count,
      ratingDistribution: [...summary.distribution],
    };
  }

  static toResponse(summary: RatingSummary): RatingSummaryResponse {
    return {
      averageRating: round2(summary.average),
      reviewCount: summary.count,
      distribution: [...summary.distribution],
    };
  }
}
