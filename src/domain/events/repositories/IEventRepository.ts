import { CreatePlanOptions } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { Event, NormalizedEventData } from "@/domain/events/entities/Event";
import { EventCard, EventDetail, EventListItem } from "@/domain/events/entities/EventDetail";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PlanConditionsFilters } from "@/domain/places/valueObjects/planConditions.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { GeoFilters } from "@/domain/core/geo/GeoFilters";

/**
 * Price/audience/accessibility filters come from `PlanConditionsFilters`. `bbox` / `radius` (`GeoFilters`)
 * match the event's resolved location: its place's point, or its own point when it has no place.
 * Events without any location never match a geo filter.
 */
export interface EventListFilters extends PlanConditionsFilters, GeoFilters {
  /**
   * Overlap lower bound: events still running at/after this instant, i.e.
   * `endsAt >= from` or (no `endsAt` and `startsAt >= from`).
   */
  from?: Date;
  /** Overlap upper bound: events starting at/before this instant (`startsAt <= to`). */
  to?: Date;
  categoryId?: number;
  placeId?: string;
  /** Through the event's place. Events without a place never match. */
  cantonId?: number;
  targetAudience?: TargetAudience;
  /** Restricts to these statuses. `undefined` means every status. */
  statuses?: ContentStatus[];
  /** Substring match on title or description. */
  search?: string;
  /** Hides the events authored by these users (the viewer's blocked people, #17). Events without an author stay. */
  excludeAuthorIds?: string[];
}

export interface IEventRepository {
  /** Items carry the place summary as loaded (any status); the service applies the visibility rule. */
  list(params: PaginationParams, filters?: EventListFilters): Promise<PaginatedResult<EventCard>>;
  find(id: string): Promise<Event | null>;
  /** Same as `find` plus the place summary and resolved location. */
  findItem(id: string): Promise<EventListItem | null>;
  findDetail(id: string): Promise<EventDetail | null>;
  /** Inserts as PENDING. `options.authorId`: the submitter, when created from a community submission. */
  create(data: NormalizedEventData, options?: CreatePlanOptions): Promise<Event>;
  update(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
}
