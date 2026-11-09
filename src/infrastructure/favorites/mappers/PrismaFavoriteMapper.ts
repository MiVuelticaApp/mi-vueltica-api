import { FavoriteItem } from "@/domain/favorites/entities/FavoriteItem";
import { PrismaPlaceMapper } from "@/infrastructure/places/mappers/PrismaPlaceMapper";
import { PrismaEventMapper, PrismaEventWithPlace } from "@/infrastructure/events/mappers/PrismaEventMapper";
import { Favorite as PrismaFavorite, Place as PrismaPlace } from "@/infrastructure/prisma/generated/prisma/client";

export type PrismaFavoriteWithTarget = PrismaFavorite & {
  place: PrismaPlace | null;
  event: PrismaEventWithPlace | null;
};

export class PrismaFavoriteMapper {
  /** Throws on a row that breaks "exactly one of placeId / eventId" instead of guessing (same as Photo). */
  static toDomain(row: PrismaFavoriteWithTarget): FavoriteItem {
    if (row.place && !row.eventId) {
      return { type: "PLACE", place: PrismaPlaceMapper.toDomain(row.place), createdAt: row.createdAt };
    }
    if (row.event && !row.placeId) {
      return { type: "EVENT", event: PrismaEventMapper.toListItem(row.event), createdAt: row.createdAt };
    }
    throw new Error(`Favorite ${row.id} must reference exactly one place or event`);
  }
}
