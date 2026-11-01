import { OpeningHoursValue } from "@/domain/places/valueObjects/openingHours.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";

export interface CreatePlaceRequest {
  cantonId: number;
  categoryId: number;
  sourceId?: string | null;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  address?: string | null;
  openingHours?: OpeningHoursValue | null;
  /** Defaults to EVERYONE. */
  targetAudience?: TargetAudience;
}
