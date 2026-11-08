import { FavoriteType } from "@/domain/favorites/entities/FavoriteItem";
import { PlaceResponse } from "@/presentation/http/places/responses/PlaceResponse";
import { EventResponse } from "@/presentation/http/events/responses/EventResponse";

/** One saved place or event: exactly one of `place` / `event` is set, as told by `type`. */
export interface FavoriteResponse {
  type: FavoriteType;
  place: PlaceResponse | null;
  event: EventResponse | null;
  /** When the user saved it. */
  createdAt: string;
}
