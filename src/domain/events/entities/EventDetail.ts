import { Event } from "./Event";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { GalleryPhoto } from "@/domain/photos/entities/Photo";
import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";
import { EventLocationValue } from "../valueObjects/eventLocation.valueObject";

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

/**
 * Where the event happens on the map: its place's point when it has one, otherwise its own
 * location, otherwise `null`. Taken from the place whatever the place's status (the event is
 * what is published; only the `place` summary is hidden from callers who may not see it).
 */
export function resolveEventLocation(event: Event, place: PlaceSummary | null): EventLocationValue | null {
  if (place) return { latitude: place.latitude, longitude: place.longitude, address: place.address };
  return event.location;
}

/** Read model for lists: the event, a summary of its place (if any) and its resolved location. */
export interface EventListItem {
  event: Event;
  /** Null when the event has no place, or the caller may not see the place (see `withVisiblePlace`). */
  place: PlaceSummary | null;
  /** From `resolveEventLocation`; kept even when `place` is hidden. */
  location: EventLocationValue | null;
}

/** Read model for the detail endpoint: the list item plus the gallery and rating. */
export interface EventDetail extends EventListItem {
  /** Ordered by `position` ascending. */
  photos: GalleryPhoto[];
  /** Over PUBLISHED reviews of the event only. */
  rating: RatingSummary;
}

/** Builds a list item from an event and its place (as loaded, before any visibility rule). */
export function toEventListItem(event: Event, place: PlaceSummary | null): EventListItem {
  return { event, place, location: resolveEventLocation(event, place) };
}

/**
 * Hides the place summary when its status is not in `statuses` (`undefined` = every status). The
 * resolved `location` stays: it describes where the event is, not the place's content.
 */
export function withVisiblePlace<T extends EventListItem>(item: T, statuses?: ContentStatus[]): T {
  if (!statuses || !item.place || statuses.includes(item.place.status)) return item;
  return { ...item, place: null };
}
