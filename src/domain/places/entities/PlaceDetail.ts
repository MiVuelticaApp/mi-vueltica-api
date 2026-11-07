import { Place } from "./Place";
import { GalleryPhoto } from "@/domain/photos/entities/Photo";
import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";

export type PlacePhoto = GalleryPhoto;

/** Aggregated over PUBLISHED reviews only. `average` is null when there are none. */
export type PlaceRating = RatingSummary;

/** Read model for the detail endpoint: the place plus its photos and rating summary. */
export interface PlaceDetail {
  place: Place;
  /** Ordered by `position` ascending. */
  photos: PlacePhoto[];
  rating: PlaceRating;
}
