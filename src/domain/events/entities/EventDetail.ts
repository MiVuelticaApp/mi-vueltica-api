import { Event } from "./Event";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { GalleryPhoto } from "@/domain/photos/entities/Photo";
import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";

/** Minimal view of the place an event takes place at. */
export interface PlaceSummary {
  id: string;
  name: string;
  cantonId: number;
  latitude: number;
  longitude: number;
  address: string | null;
  status: ContentStatus;
}

/** Read model for the detail endpoint: the event, a summary of its place (if any), its gallery and rating. */
export interface EventDetail {
  event: Event;
  place: PlaceSummary | null;
  /** Ordered by `position` ascending. */
  photos: GalleryPhoto[];
  /** Over PUBLISHED reviews of the event only. */
  rating: RatingSummary;
}
