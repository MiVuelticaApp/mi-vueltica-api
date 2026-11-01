import { Place } from "./Place";

export interface PlacePhoto {
  id: string;
  url: string;
  position: number;
}

/** Aggregated over PUBLISHED reviews only. `average` is null when there are none. */
export interface PlaceRating {
  average: number | null;
  count: number;
}

/** Read model for the detail endpoint: the place plus its photos and rating summary. */
export interface PlaceDetail {
  place: Place;
  /** Ordered by `position` ascending. */
  photos: PlacePhoto[];
  rating: PlaceRating;
}
