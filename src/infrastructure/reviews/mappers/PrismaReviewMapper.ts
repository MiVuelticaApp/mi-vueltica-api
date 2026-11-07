import { Review } from "@/domain/reviews/entities/Review";
import { ReviewDetail, initialsOf } from "@/domain/reviews/entities/ReviewDetail";
import { SpentTier, WentWith } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import {
  Prisma,
  Review as PrismaReview,
  ReviewCompanion,
  ReviewSpend,
} from "@/infrastructure/prisma/generated/prisma/client";

// The API speaks the app's strings; the database keeps uppercase enums like the rest of the schema.
const WENT_WITH_TO_DB: Record<WentWith, ReviewCompanion> = {
  familia: "FAMILY",
  amigos: "FRIENDS",
  pareja: "PARTNER",
  solo: "SOLO",
};
const SPENT_TO_DB: Record<SpentTier, ReviewSpend> = {
  nada: "NOTHING",
  menos2500: "UNDER_2500",
  entre2500y5000: "FROM_2500_TO_5000",
};
const invert = <K extends string, V extends string>(map: Record<K, V>) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>;
const WENT_WITH_FROM_DB = invert(WENT_WITH_TO_DB);
const SPENT_FROM_DB = invert(SPENT_TO_DB);

export const wentWithToDb = (value: WentWith | null): ReviewCompanion | null => (value ? WENT_WITH_TO_DB[value] : null);
export const spentToDb = (value: SpentTier | null): ReviewSpend | null => (value ? SPENT_TO_DB[value] : null);
export const wentWithListToDb = (values: WentWith[]): ReviewCompanion[] => values.map((value) => WENT_WITH_TO_DB[value]);

/** `include` that loads what `toDetail` needs; `viewerId` limits the votes to the caller's own. */
export function reviewDetailInclude(viewerId?: string) {
  return {
    user: { select: { id: true, name: true, surnames: true } },
    place: { select: { id: true, name: true } },
    event: { select: { id: true, title: true } },
    photos: { select: { url: true }, orderBy: { position: "asc" } },
    _count: { select: { usefulVotes: true } },
    // An impossible filter when there is no viewer, so the shape is always the same.
    usefulVotes: { where: { userId: viewerId ?? "" }, select: { userId: true }, take: 1 },
  } satisfies Prisma.ReviewInclude;
}

export type PrismaReviewWithRelations = Prisma.ReviewGetPayload<{ include: ReturnType<typeof reviewDetailInclude> }>;

export class PrismaReviewMapper {
  static toDomain(row: PrismaReview): Review {
    return new Review({
      id: row.id,
      userId: row.userId,
      placeId: row.placeId,
      eventId: row.eventId,
      rating: row.rating,
      comment: row.comment,
      wentWith: row.wentWith ? WENT_WITH_FROM_DB[row.wentWith] : null,
      spent: row.spent ? SPENT_FROM_DB[row.spent] : null,
      status: row.status,
      createdAt: row.createdAt,
    });
  }

  static toDetail(row: PrismaReviewWithRelations, viewerId?: string): ReviewDetail {
    return {
      review: PrismaReviewMapper.toDomain(row),
      author: row.user
        ? { id: row.user.id, name: row.user.name, initials: initialsOf(row.user.name, row.user.surnames) }
        : null,
      place: row.place ? { id: row.place.id, name: row.place.name } : null,
      event: row.event ? { id: row.event.id, title: row.event.title } : null,
      photos: row.photos.map((photo) => photo.url),
      usefulCount: row._count.usefulVotes,
      markedUsefulByMe: viewerId !== undefined && row.usefulVotes.length > 0,
    };
  }
}
