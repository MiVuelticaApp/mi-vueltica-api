import { OpeningHoursValue } from "@/domain/places/valueObjects/openingHours.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
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
