import { Event, NormalizedEventData } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface EventListFilters {
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
}

export interface IEventRepository {
  list(params: PaginationParams, filters?: EventListFilters): Promise<PaginatedResult<Event>>;
  find(id: string): Promise<Event | null>;
  findDetail(id: string): Promise<EventDetail | null>;
  /** New events are always created as PENDING. */
  create(data: NormalizedEventData): Promise<Event>;
  update(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
}
