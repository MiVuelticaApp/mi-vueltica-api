import { Place } from "./Place";
import { PlanStats } from "@/domain/core/plans/PlanStats";

/** Read model for place lists (and saved places): the place plus what its card shows. */
export interface PlaceCard {
  place: Place;
  stats: PlanStats;
}
