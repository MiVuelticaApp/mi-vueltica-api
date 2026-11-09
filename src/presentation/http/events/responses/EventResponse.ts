import { VerificationFieldsResponse } from "@/presentation/http/community/responses/CommunityResponses";
import { RatingFieldsResponse } from "@/presentation/http/reviews/responses/RatingSummaryResponse";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { Audience, FreeForGroup, PriceTier } from "@/domain/places/valueObjects/planConditions.valueObject";
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
  /**
   * Where the event is on the map: the place's point when `placeId` is set, otherwise the event's own
   * location; all three null when it has neither. Write them only for events without a place.
   */
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  /** Null when the event has no place or the caller may not see it (not PUBLISHED). */
  place: PlaceSummaryResponse | null;
  targetAudience: TargetAudience;
  /** Colones per person; 0 = free, null = unknown. */
  pricePerPerson: number | null;
  /** Derived from `pricePerPerson`; null when the price is unknown (the app shows it as `hasta5000`). */
  priceTier: PriceTier | null;
  /** Groups that enter free even when `pricePerPerson > 0`. */
  freeFor: FreeForGroup[];
  audiences: Audience[];
  wheelchair: boolean;
  status: ContentStatus;
  /** Why the plan is hidden (ARCHIVED by verifications, reports or moderation); null otherwise. */
  hiddenReason: string | null;
  /** Who contributed it: "Ana M." (first name + surname initial), "Anónimo" for a community plan without a known author, null for team content. */
  authorName: string | null;
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

export interface EventPhotoResponse {
  id: string;
  url: string;
  position: number;
}

export interface EventDetailResponse extends EventResponse, RatingFieldsResponse, VerificationFieldsResponse {
  /** The event's own gallery, ordered by `position` ascending. */
  photos: EventPhotoResponse[];
  /** Whether the authenticated caller saved it. Omitted for anonymous callers. */
  isFavorite?: boolean;
  /** Whether the authenticated caller is the author (their submission created it). Omitted for anonymous callers. */
  isMine?: boolean;
}
