import { Event, EventData, normalizeEventData } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { IEventRepository, EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { IEventService, EventInput, EventVisibilityOptions } from "../interfaces/IEventService";
import { EventNotFoundError } from "../../errors/EventNotFoundError";
import { InvalidPlaceError } from "../../errors/InvalidPlaceError";
import { InvalidCategoryError } from "@/application/places/errors/InvalidCategoryError";
import { InvalidSourceError } from "@/application/places/errors/InvalidSourceError";

export class EventService implements IEventService {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly sourceRepository: ISourceRepository,
  ) {}

  async list(params: PaginationParams, filters?: EventListFilters): Promise<PaginatedResult<Event>> {
    return this.eventRepository.list(params, filters);
  }

  async get(id: string, options: EventVisibilityOptions = {}): Promise<EventDetail> {
    const detail = await this.eventRepository.findDetail(id);
    if (!detail) throw new EventNotFoundError();
    const { statuses } = options;
    if (statuses && !statuses.includes(detail.event.status)) {
      throw new EventNotFoundError();
    }
    // Do not leak a place that the caller is not allowed to see.
    if (statuses && detail.place && !statuses.includes(detail.place.status)) {
      return { event: detail.event, place: null };
    }
    return detail;
  }

  async create(data: EventInput): Promise<Event> {
    const normalized = normalizeEventData(data);
    await this.ensureReferencesExist(normalized);
    return this.eventRepository.create(normalized);
  }

  async update(id: string, data: EventInput): Promise<Event> {
    const event = await this.findOrFail(id);
    // Validate the payload before touching the database for references.
    event.update(data);
    await this.ensureReferencesExist(normalizeEventData(data));
    await this.eventRepository.update(event);
    return this.findOrFail(id);
  }

  async changeStatus(id: string, status: ContentStatus): Promise<Event> {
    const event = await this.findOrFail(id);
    event.changeStatus(parseContentStatus(status));
    await this.eventRepository.update(event);
    return this.findOrFail(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOrFail(id);
    // Notifications cascade at DB level.
    await this.eventRepository.delete(id);
  }

  private async findOrFail(id: string): Promise<Event> {
    const event = await this.eventRepository.find(id);
    if (!event) throw new EventNotFoundError();
    return event;
  }

  private async ensureReferencesExist(data: Pick<EventData, "placeId" | "categoryId" | "sourceId">): Promise<void> {
    if (data.placeId && !(await this.placeRepository.find(data.placeId))) throw new InvalidPlaceError();
    if (!(await this.categoryRepository.find(data.categoryId))) throw new InvalidCategoryError();
    if (data.sourceId && !(await this.sourceRepository.find(data.sourceId))) throw new InvalidSourceError();
  }
}
