import { FavoriteItem } from "@/domain/favorites/entities/FavoriteItem";
import PlaceDtoMapper from "@/presentation/http/places/mappers/Place.mapper";
import EventDtoMapper from "@/presentation/http/events/mappers/Event.mapper";
import { FavoriteResponse } from "../responses/FavoriteResponse";

export default class FavoriteDtoMapper {
  static toResponse(favorite: FavoriteItem): FavoriteResponse {
    return {
      type: favorite.type,
      place: favorite.type === "PLACE" ? PlaceDtoMapper.toCardResponse(favorite.place) : null,
      event: favorite.type === "EVENT" ? EventDtoMapper.toCardResponse(favorite.event) : null,
      createdAt: favorite.createdAt.toISOString(),
    };
  }
}
