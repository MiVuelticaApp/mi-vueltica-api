import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

/** Datetimes are always ISO 8601 in UTC (`toISOString()`). */
export interface EventResponse {
  id: string;
  placeId: string | null;
  categoryId: number;
  sourceId: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  targetAudience: TargetAudience;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceSummaryResponse {
  id: string;
  name: string;
  cantonId: number;
  latitude: number;
  longitude: number;
  address: string | null;
  status: ContentStatus;
}

export interface EventDetailResponse extends EventResponse {
  /** Null when the event has no place or the caller may not see it (not PUBLISHED). */
  place: PlaceSummaryResponse | null;
}
