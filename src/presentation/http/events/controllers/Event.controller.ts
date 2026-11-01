import { Request, Response } from "express";
import { z } from "zod";
import { IEventService } from "@/application/events/services/interfaces/IEventService";
import { EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListEventsQuerySchema } from "../validators/listEvents";
import { CreateEventRequest } from "../requests/CreateEventRequest";
import { UpdateEventRequest } from "../requests/UpdateEventRequest";
import { ChangeEventStatusRequest } from "../requests/ChangeEventStatusRequest";
import EventDtoMapper from "../mappers/Event.mapper";

type ListQuery = z.output<typeof ListEventsQuerySchema>;
type IdParams = { id: string };

const PUBLIC_STATUSES: ContentStatus[] = ["PUBLISHED"];

/** MODERATOR / ADMIN (set by `optionalJwtAuth` from the database) may see unpublished events. */
function canSeeUnpublished(req: Request): boolean {
  const role = req.user?.role;
  return role === "MODERATOR" || role === "ADMIN";
}

export default class EventController {
  constructor(private readonly eventService: IEventService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const privileged = canSeeUnpublished(req);

    const filters: EventListFilters = {
      from: query.from,
      to: query.to,
      categoryId: query.categoryId,
      placeId: query.placeId,
      cantonId: query.cantonId,
      targetAudience: query.targetAudience,
      // Anonymous/regular users only ever see PUBLISHED and the `status` param is ignored.
      statuses: privileged ? (query.status ? [query.status] : undefined) : PUBLIC_STATUSES,
      search: query.q || undefined,
    };

    const result = await this.eventService.list(toPaginationParams(query), filters);
    res.json(toPaginatedResponse(result, EventDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const detail = await this.eventService.get(id, {
      statuses: canSeeUnpublished(req) ? undefined : PUBLIC_STATUSES,
    });
    res.json(EventDtoMapper.toDetailResponse(detail));
  }

  async create(req: Request, res: Response): Promise<void> {
    const body: CreateEventRequest = req.body;
    const event = await this.eventService.create(body);
    res.status(201).json(EventDtoMapper.toResponse(event));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const body: UpdateEventRequest = req.body;
    const event = await this.eventService.update(id, body);
    res.json(EventDtoMapper.toResponse(event));
  }

  async changeStatus(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { status }: ChangeEventStatusRequest = req.body;
    const event = await this.eventService.changeStatus(id, status);
    res.json(EventDtoMapper.toResponse(event));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.eventService.delete(id);
    res.status(204).send();
  }
}
