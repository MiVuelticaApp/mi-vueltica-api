import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { ReviewAuthorResponse, ReviewResponse } from "../responses/ReviewResponse";

/** Defensive fallback for a review without an author (reviews are deleted with the account, so it should not happen). */
export const ANONYMOUS_AUTHOR: ReviewAuthorResponse = { id: null, name: "Anónimo", initials: "A" };

export default class ReviewDtoMapper {
  static toResponse(detail: ReviewDetail): ReviewResponse {
    const { review } = detail;
    return {
      id: review.id,
      placeId: review.placeId,
      eventId: review.eventId,
      rating: review.rating,
      comment: review.comment,
      wentWith: review.wentWith,
      spent: review.spent,
      photos: [...detail.photos],
      usefulCount: detail.usefulCount,
      markedUsefulByMe: detail.markedUsefulByMe,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      author: detail.author
        ? { id: detail.author.id, name: detail.author.name, initials: detail.author.initials }
        : { ...ANONYMOUS_AUTHOR },
      place: detail.place ? { id: detail.place.id, name: detail.place.name } : null,
      event: detail.event ? { id: detail.event.id, title: detail.event.title } : null,
    };
  }
}
