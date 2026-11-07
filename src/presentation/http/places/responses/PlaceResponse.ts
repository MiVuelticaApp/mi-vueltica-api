import { OpeningHoursValue } from "@/domain/places/valueObjects/openingHours.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { Audience, FreeForGroup, PriceTier } from "@/domain/places/valueObjects/planConditions.valueObject";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface PlaceResponse {
  id: string;
  cantonId: number;
  categoryId: number;
  sourceId: string | null;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  openingHours: OpeningHoursValue | null;
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
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlacePhotoResponse {
  id: string;
  url: string;
  position: number;
}

export interface PlaceDetailResponse extends PlaceResponse {
  /** Ordered by `position` ascending. */
  photos: PlacePhotoResponse[];
  /** Mean of PUBLISHED reviews rounded to 2 decimals; null when there are none. */
  averageRating: number | null;
  /** Number of PUBLISHED reviews. */
  reviewCount: number;
  /** Whether the authenticated caller favorited this place. Omitted for anonymous callers. */
  isFavorite?: boolean;
}
