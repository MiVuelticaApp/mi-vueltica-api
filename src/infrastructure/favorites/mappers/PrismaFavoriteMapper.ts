import { FavoritePlace } from "@/domain/favorites/entities/FavoritePlace";
import { PrismaPlaceMapper } from "@/infrastructure/places/mappers/PrismaPlaceMapper";
import { Favorite as PrismaFavorite, Place as PrismaPlace } from "@/infrastructure/prisma/generated/prisma/client";

export type PrismaFavoriteWithPlace = PrismaFavorite & { place: PrismaPlace };

export class PrismaFavoriteMapper {
  static toDomain(row: PrismaFavoriteWithPlace): FavoritePlace {
    return { place: PrismaPlaceMapper.toDomain(row.place), createdAt: row.createdAt };
  }
}
