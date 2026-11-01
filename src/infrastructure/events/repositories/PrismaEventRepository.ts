import { Event, NormalizedEventData } from "@/domain/events/entities/Event";
import { EventDetail } from "@/domain/events/entities/EventDetail";
import { IEventRepository, EventListFilters } from "@/domain/events/repositories/IEventRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaEventMapper } from "../mappers/PrismaEventMapper";

export default class PrismaEventRepository implements IEventRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: EventListFilters = {}): Promise<PaginatedResult<Event>> {
    try {
      const where = this.buildWhere(filters);
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.event.findMany({
              where,
              skip: page.skip,
              take: page.take,
              // `id` as tie-breaker keeps pagination stable when the sort field has duplicates.
              orderBy: [page.orderBy ?? { startsAt: "asc" }, { id: "asc" }] as Prisma.EventOrderByWithRelationInput[],
            }),
          count: (tx) => tx.event.count({ where }),
        },
        PrismaEventMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing events:", error);
      throw new DatabaseError("Could not list events", error);
    }
  }

  async find(id: string): Promise<Event | null> {
    try {
      const row = await this.client.event.findUnique({ where: { id } });
      return row ? PrismaEventMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding event:", error);
      throw new DatabaseError("Could not find event", error);
    }
  }

  async findDetail(id: string): Promise<EventDetail | null> {
    try {
      const row = await this.client.event.findUnique({ where: { id }, include: { place: true } });
      if (!row) return null;
      return {
        event: PrismaEventMapper.toDomain(row),
        place: row.place ? PrismaEventMapper.placeSummaryToDomain(row.place) : null,
      };
    } catch (error) {
      console.error("Error finding event detail:", error);
      throw new DatabaseError("Could not find event", error);
    }
  }

  async create(data: NormalizedEventData): Promise<Event> {
    try {
      const row = await this.client.event.create({
        data: {
          placeId: data.placeId,
          categoryId: data.categoryId,
          sourceId: data.sourceId,
          title: data.title,
          description: data.description,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          targetAudience: data.targetAudience,
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
          targetAudience: event.targetAudience,
          status: event.status,
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

  private buildWhere(filters: EventListFilters): Prisma.EventWhereInput {
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
    if (and.length > 0) where.AND = and;

    return where;
  }
}
