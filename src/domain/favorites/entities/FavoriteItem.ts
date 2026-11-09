import { PlaceCard } from "@/domain/places/entities/PlaceCard";
import { EventCard } from "@/domain/events/entities/EventDetail";
import { PlanTarget, PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";

/** A favorite is about exactly one Place or one Event (enforced by the application, not a CHECK; see Photo). */
export type FavoriteTarget = PlanTarget;
export type FavoriteType = PlanTargetType;

/** Read model for the favorites list: what the user saved plus when they saved it. */
export type FavoriteItem =
  | { type: "PLACE"; place: PlaceCard; createdAt: Date }
  | { type: "EVENT"; event: EventCard; createdAt: Date };
