import { Place } from "@/domain/places/entities/Place";
import { EventListItem } from "@/domain/events/entities/EventDetail";
import { PlanTarget, PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";

/** A favorite is about exactly one Place or one Event (enforced by the application, not a CHECK; see Photo). */
export type FavoriteTarget = PlanTarget;
export type FavoriteType = PlanTargetType;

/** Read model for the favorites list: what the user saved plus when they saved it. */
export type FavoriteItem =
  | { type: "PLACE"; place: Place; createdAt: Date }
  | { type: "EVENT"; event: EventListItem; createdAt: Date };
