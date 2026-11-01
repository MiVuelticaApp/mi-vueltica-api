import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";

/** Validated body: the datetimes are already parsed into `Date`s by the Zod schema. */
export interface CreateEventRequest {
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
