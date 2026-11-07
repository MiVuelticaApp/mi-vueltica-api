import { Review } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { Review as PrismaReview } from "@/infrastructure/prisma/generated/prisma/client";

export type PrismaReviewWithRelations = PrismaReview & {
  user: { id: string; name: string };
  place: { id: string; name: string };
};

/** `include` that loads what `toDetail` needs (only the author's id and first name). */
export const REVIEW_DETAIL_INCLUDE = {
  user: { select: { id: true, name: true } },
  place: { select: { id: true, name: true } },
} as const;

export class PrismaReviewMapper {
  static toDomain(row: PrismaReview): Review {
    return new Review({
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
      createdAt: row.createdAt,
    });
  }

  static toDetail(row: PrismaReviewWithRelations): ReviewDetail {
    return {
      review: PrismaReviewMapper.toDomain(row),
      author: { id: row.user.id, name: row.user.name },
      place: { id: row.place.id, name: row.place.name },
    };
  }
}
