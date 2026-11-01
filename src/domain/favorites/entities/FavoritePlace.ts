import { Place } from "@/domain/places/entities/Place";

/** Read model for the favorites list: the place plus when the user favorited it. */
export interface FavoritePlace {
  place: Place;
  createdAt: Date;
}
