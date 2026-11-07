import { PlanConditionsData } from "@/domain/places/valueObjects/planConditions.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";

/** Validated body: the datetimes are already parsed into `Date`s by the Zod schema. */
/** Also carries `pricePerPerson`, `freeFor`, `audiences` and `wheelchair` (`PlanConditionsData`). */
export interface CreateEventRequest extends PlanConditionsData {
  placeId?: string | null;
  categoryId: number;
  sourceId?: string | null;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  /** Defaults to EVERYONE. */
  targetAudience?: TargetAudience;
}
