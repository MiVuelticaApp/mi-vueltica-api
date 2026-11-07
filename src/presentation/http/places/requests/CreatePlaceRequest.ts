import { OpeningHoursValue } from "@/domain/places/valueObjects/openingHours.valueObject";
import { PlanConditionsData } from "@/domain/places/valueObjects/planConditions.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";

/** Also carries `pricePerPerson`, `freeFor`, `audiences` and `wheelchair` (`PlanConditionsData`). */
export interface CreatePlaceRequest extends PlanConditionsData {
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
