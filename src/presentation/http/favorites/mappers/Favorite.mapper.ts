import { FavoritePlace } from "@/domain/favorites/entities/FavoritePlace";
import PlaceDtoMapper from "@/presentation/http/places/mappers/Place.mapper";
import { FavoritePlaceResponse } from "../responses/FavoriteResponse";

export default class FavoriteDtoMapper {
  static toResponse(favorite: FavoritePlace): FavoritePlaceResponse {
    return {
      place: PlaceDtoMapper.toResponse(favorite.place),
      createdAt: favorite.createdAt.toISOString(),
    };
  }
}
