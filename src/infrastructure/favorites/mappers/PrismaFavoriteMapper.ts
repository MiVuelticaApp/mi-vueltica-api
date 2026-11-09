import { FavoriteItem } from "@/domain/favorites/entities/FavoriteItem";
import { PrismaPlaceMapper } from "@/infrastructure/places/mappers/PrismaPlaceMapper";
import { PrismaEventMapper, PrismaEventWithPlace } from "@/infrastructure/events/mappers/PrismaEventMapper";
import { Favorite as PrismaFavorite, Place as PrismaPlace } from "@/infrastructure/prisma/generated/prisma/client";
import { PlanAuthorRow } from "@/infrastructure/core/repositories/planAuthor";
import { CoverPhotoRow, publishedRatingsFor, toPlanStats } from "@/infrastructure/core/repositories/planStats";

type Ratings = Awaited<ReturnType<typeof publishedRatingsFor>>;

export type PrismaFavoriteWithTarget = PrismaFavorite & {
  place: (PrismaPlace & Pick<PlanAuthorRow, "author"> & CoverPhotoRow) | null;
  event: (PrismaEventWithPlace & CoverPhotoRow) | null;
};

export class PrismaFavoriteMapper {
  /**
   * Throws on a row that breaks "exactly one of placeId / eventId" instead of guessing (same as Photo).
   * `placeRatings` / `eventRatings` are the page's ratings from `publishedRatingsFor`.
   */
  static toDomain(row: PrismaFavoriteWithTarget, placeRatings: Ratings, eventRatings: Ratings): FavoriteItem {
    if (row.place && !row.eventId) {
      return {
        type: "PLACE",
        place: { place: PrismaPlaceMapper.toDomain(row.place), stats: toPlanStats(row.place, placeRatings.get(row.place.id)) },
        createdAt: row.createdAt,
      };
    }
    if (row.event && !row.placeId) {
      return {
        type: "EVENT",
        event: { ...PrismaEventMapper.toListItem(row.event), stats: toPlanStats(row.event, eventRatings.get(row.event.id)) },
        createdAt: row.createdAt,
      };
    }
    throw new Error(`Favorite ${row.id} must reference exactly one place or event`);
  }
}
