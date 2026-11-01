import { PlaceResponse } from "@/presentation/http/places/responses/PlaceResponse";

export interface FavoritePlaceResponse {
  place: PlaceResponse;
  /** When the user favorited the place. */
  createdAt: string;
}
