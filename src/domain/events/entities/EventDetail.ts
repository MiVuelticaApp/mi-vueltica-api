import { Event } from "./Event";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

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

/** Read model for the detail endpoint: the event plus a summary of its place (if any). */
export interface EventDetail {
  event: Event;
  place: PlaceSummary | null;
}
