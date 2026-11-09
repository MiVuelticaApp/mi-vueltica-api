import { EventData } from "@/domain/events/entities/Event";
import { EventCard, EventDetail, EventListItem } from "@/domain/events/entities/EventDetail";
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
  /** The caller's user id: the author of a plan always sees it, whatever its status (e.g. hidden, with the reason). */
  viewerId?: string;
}

export interface IEventService {
  /** `filters.statuses` also hides the place summary of places outside those statuses (the location stays). */
  list(params: PaginationParams, filters?: EventListFilters): Promise<PaginatedResult<EventCard>>;
  /** Throws `EventNotFoundError` when missing or hidden by `options.statuses`. */
  get(id: string, options?: EventVisibilityOptions): Promise<EventDetail>;
  create(data: EventInput): Promise<EventListItem>;
  update(id: string, data: EventInput): Promise<EventListItem>;
  changeStatus(id: string, status: ContentStatus): Promise<EventListItem>;
  delete(id: string): Promise<void>;
}
