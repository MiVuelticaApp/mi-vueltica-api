import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { ReviewResponse } from "../responses/ReviewResponse";

export default class ReviewDtoMapper {
  static toResponse(detail: ReviewDetail): ReviewResponse {
    const { review } = detail;
    return {
      id: review.id,
      placeId: review.placeId,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      author: { id: detail.author.id, name: detail.author.name },
      place: { id: detail.place.id, name: detail.place.name },
    };
  }
}
