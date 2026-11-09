import { FavoriteType } from "@/domain/favorites/entities/FavoriteItem";
import { PlaceCardResponse } from "@/presentation/http/places/responses/PlaceResponse";
import { EventCardResponse } from "@/presentation/http/events/responses/EventResponse";

/** One saved place or event: exactly one of `place` / `event` is set, as told by `type`. */
export interface FavoriteResponse {
  type: FavoriteType;
  place: PlaceCardResponse | null;
  event: EventCardResponse | null;
  /** When the user saved it. */
  createdAt: string;
}
