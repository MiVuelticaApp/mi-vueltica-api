import { CreatePlanOptions } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { Event, NormalizedEventData } from "@/domain/events/entities/Event";
import { EventDetail, EventListItem } from "@/domain/events/entities/EventDetail";
import { IEventRepository, EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { BoundingBox, RadiusFilter } from "@/domain/core/geo/GeoFilters";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaPhotoMapper } from "@/infrastructure/photos/mappers/PrismaPhotoMapper";
import { planConditionsToColumns, planConditionsWhere } from "@/infrastructure/core/repositories/planConditions";
import { withinRadiusSql } from "@/infrastructure/core/repositories/geo";
import { PLAN_AUTHOR_INCLUDE } from "@/infrastructure/core/repositories/planAuthor";
import { publishedRatingSummary } from "@/infrastructure/reviews/repositories/ratingSummary";
import { PrismaEventMapper } from "../mappers/PrismaEventMapper";

export default class PrismaEventRepository implements IEventRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: EventListFilters = {}): Promise<PaginatedResult<EventListItem>> {
    try {
      const where = await this.buildWhere(filters);
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.event.findMany({
              where,
              // The place summary is embedded so clients need no request per place (#37).
              include: { place: true, ...PLAN_AUTHOR_INCLUDE },
              skip: page.skip,
              take: page.take,
              // `id` as tie-breaker keeps pagination stable when the sort field has duplicates.
              orderBy: [page.orderBy ?? { startsAt: "asc" }, { id: "asc" }] as Prisma.EventOrderByWithRelationInput[],
            }),
          count: (tx) => tx.event.count({ where }),
        },
        PrismaEventMapper.toListItem,
      );
    } catch (error) {
      console.error("Error listing events:", error);
      throw new DatabaseError("Could not list events", error);
    }
  }

  async find(id: string): Promise<Event | null> {
    try {
      const row = await this.client.event.findUnique({ where: { id }, include: PLAN_AUTHOR_INCLUDE });
      return row ? PrismaEventMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding event:", error);
      throw new DatabaseError("Could not find event", error);
    }
  }

  async findItem(id: string): Promise<EventListItem | null> {
    try {
      const row = await this.client.event.findUnique({ where: { id }, include: { place: true, ...PLAN_AUTHOR_INCLUDE } });
      return row ? PrismaEventMapper.toListItem(row) : null;
    } catch (error) {
      console.error("Error finding event:", error);
      throw new DatabaseError("Could not find event", error);
    }
  }

  async findDetail(id: string): Promise<EventDetail | null> {
    try {
      const [row, rating] = await Promise.all([
        this.client.event.findUnique({
          where: { id },
          include: { place: true, ...PLAN_AUTHOR_INCLUDE, photos: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
        }),
        publishedRatingSummary(this.client, { eventId: id }),
      ]);
      if (!row) return null;
      return {
        ...PrismaEventMapper.toListItem(row),
        photos: row.photos.map(PrismaPhotoMapper.toGalleryPhoto),
        rating,
      };
    } catch (error) {
      console.error("Error finding event detail:", error);
      throw new DatabaseError("Could not find event", error);
    }
  }

  async create(data: NormalizedEventData, options: CreatePlanOptions = {}): Promise<Event> {
    try {
      const row = await this.client.event.create({
        include: PLAN_AUTHOR_INCLUDE,
        data: {
          placeId: data.placeId,
          categoryId: data.categoryId,
          sourceId: data.sourceId,
          title: data.title,
          description: data.description,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          targetAudience: data.targetAudience,
          ...planConditionsToColumns(data),
          authorId: options.authorId ?? null,
          status: "PENDING",
        },
      });
      return PrismaEventMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating event:", error);
      throw new DatabaseInsertError("Could not create event", error);
    }
  }

  async update(event: Event): Promise<void> {
    try {
      await this.client.event.update({
        where: { id: event.id },
        data: {
          placeId: event.placeId,
          categoryId: event.categoryId,
          sourceId: event.sourceId,
          title: event.title,
          description: event.description,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          latitude: event.location?.latitude ?? null,
          longitude: event.location?.longitude ?? null,
          address: event.location?.address ?? null,
          targetAudience: event.targetAudience,
          ...planConditionsToColumns(event),
          status: event.status,
          hiddenReason: event.hiddenReason,
          reportedAt: event.reportedAt,
        },
      });
    } catch (error) {
      console.error("Error updating event:", error);
      throw new DatabaseInsertError("Could not update event", error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.event.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new DatabaseInsertError("Could not delete event", error);
    }
  }

  private async buildWhere(filters: EventListFilters): Promise<Prisma.EventWhereInput> {
    const where: Prisma.EventWhereInput = {};
    const and: Prisma.EventWhereInput[] = [];

    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.placeId !== undefined) where.placeId = filters.placeId;
    if (filters.cantonId !== undefined) where.place = { cantonId: filters.cantonId };
    if (filters.targetAudience) where.targetAudience = filters.targetAudience;
    if (filters.statuses) where.status = { in: filters.statuses };

    // Overlap semantics: still running at/after `from` and starting at/before `to`.
    if (filters.to) where.startsAt = { lte: filters.to };
    if (filters.from) {
      and.push({
        OR: [
          { endsAt: { gte: filters.from } },
          { endsAt: null, startsAt: { gte: filters.from } },
        ],
      });
    }
    if (filters.search) {
      and.push({
        OR: [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      });
    }
    and.push(...planConditionsWhere(filters));

    if (filters.bbox) {
      and.push(this.withinBoundingBox(filters.bbox));
    } else if (filters.radius) {
      // Ids first, then `id IN (...)` keeps pagination and count in Prisma (same as places).
      const ids = await this.findIdsWithinRadius(filters.radius);
      and.push({ id: { in: ids } });
    }

    if (and.length > 0) where.AND = and;
    return where;
  }

  /** The event's resolved location is inside the box: its place's point, or its own when it has no place. */
  private withinBoundingBox({ minLat, minLng, maxLat, maxLng }: BoundingBox): Prisma.EventWhereInput {
    const latitude = { gte: minLat, lte: maxLat };
    const longitude = { gte: minLng, lte: maxLng };
    return {
      OR: [
        { placeId: null, latitude, longitude },
        { place: { latitude, longitude } },
      ],
    };
  }

  /**
   * Ids of events whose resolved location is within the radius. Two branches so that each one can
   * use its (latitude, longitude) index: events with their own point, and events through their place
   * (whatever the place's status, like the resolved location in responses). Fully parameterized.
   */
  private async findIdsWithinRadius(radius: RadiusFilter): Promise<string[]> {
    const rows = await this.client.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT e.id FROM Event e
      WHERE e.placeId IS NULL AND ${withinRadiusSql("e.latitude", "e.longitude", radius)}
      UNION
      SELECT e.id FROM Event e INNER JOIN Place p ON p.id = e.placeId
      WHERE ${withinRadiusSql("p.latitude", "p.longitude", radius)}
    `);
    return rows.map((row) => row.id);
  }
}
