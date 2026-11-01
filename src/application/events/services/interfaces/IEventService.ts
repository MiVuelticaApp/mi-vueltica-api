import { Event, EventData } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export type EventInput = EventData;

export interface EventVisibilityOptions {
  /**
   * Only events in these statuses are visible; the linked place is also hidden (`place: null`)
   * when its status is not in the list. `undefined` means every status.
   */
  statuses?: ContentStatus[];
}

export interface IEventService {
  list(params: PaginationParams, filters?: EventListFilters): Promise<PaginatedResult<Event>>;
  /** Throws `EventNotFoundError` when missing or hidden by `options.statuses`. */
  get(id: string, options?: EventVisibilityOptions): Promise<EventDetail>;
  create(data: EventInput): Promise<Event>;
  update(id: string, data: EventInput): Promise<Event>;
  changeStatus(id: string, status: ContentStatus): Promise<Event>;
  delete(id: string): Promise<void>;
}
