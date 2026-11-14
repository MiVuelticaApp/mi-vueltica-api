import { randomUUID } from "crypto";
import { FavoriteItem, FavoriteTarget } from "@/domain/favorites/entities/FavoriteItem";
import { FavoriteListFilters, IFavoriteRepository } from "@/domain/favorites/repositories/IFavoriteRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaFavoriteMapper } from "../mappers/PrismaFavoriteMapper";
import { COVER_PHOTO_INCLUDE, publishedRatingsFor } from "@/infrastructure/core/repositories/planStats";
import { PLAN_AUTHOR_INCLUDE } from "@/infrastructure/core/repositories/planAuthor";

/** `placeId` or `eventId` for a target: exactly one is ever set. */
function targetColumns(target: FavoriteTarget): { placeId: string | null; eventId: string | null } {
  return target.type === "PLACE" ? { placeId: target.id, eventId: null } : { placeId: null, eventId: target.id };
}

export default class PrismaFavoriteRepository implements IFavoriteRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listForUser(
    userId: string,
    params: PaginationParams,
    filters: FavoriteListFilters = {},
  ): Promise<PaginatedResult<FavoriteItem>> {
    try {
      // Unpublished targets are hidden (not deleted): the row stays and reappears on re-publish.
      const publishedPlace: Prisma.FavoriteWhereInput = { place: { status: "PUBLISHED" } };
      const publishedEvent: Prisma.FavoriteWhereInput = { event: { status: "PUBLISHED" } };
      // A favorite is about a place xor an event. Positive conditions only (`IS NULL` or "author not blocked"): a
      // negated filter on a nullable column would drop the rows whose place / event / author is NULL (SQL NULL logic).
      const ids = filters.excludeAuthorIds ?? [];
      const authorNotBlocked = { OR: [{ authorId: null }, { authorId: { notIn: ids } }] };
      const notBlocked: Prisma.FavoriteWhereInput[] =
        ids.length > 0 ? [{ OR: [{ place: null }, { place: authorNotBlocked }] }, { OR: [{ event: null }, { event: authorNotBlocked }] }] : [];
      const where: Prisma.FavoriteWhereInput = {
        userId,
        ...(filters.type === "PLACE"
          ? publishedPlace
          : filters.type === "EVENT"
            ? publishedEvent
            : { OR: [publishedPlace, publishedEvent] }),
        ...(notBlocked.length > 0 ? { AND: notBlocked } : {}),
      };
      // Most recently favorited first unless a direction is given; `id` keeps pages stable.
      const direction = params.sort?.direction ?? "desc";
      const page = await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.favorite.findMany({
              where,
              include: {
                place: { include: { ...PLAN_AUTHOR_INCLUDE, ...COVER_PHOTO_INCLUDE } },
                event: { include: { place: true, ...PLAN_AUTHOR_INCLUDE, ...COVER_PHOTO_INCLUDE } },
              },
              skip: page.skip,
              take: page.take,
              orderBy: [{ createdAt: direction }, { id: "asc" }],
            }),
          count: (tx) => tx.favorite.count({ where }),
        },
        (row) => row,
      );
      // Card stats for the saved places and events of the page: two grouped queries at most.
      const placeIds = page.items.flatMap((row) => (row.placeId ? [row.placeId] : []));
      const eventIds = page.items.flatMap((row) => (row.eventId ? [row.eventId] : []));
      const [placeRatings, eventRatings] = await Promise.all([
        publishedRatingsFor(this.client, "place", placeIds),
        publishedRatingsFor(this.client, "event", eventIds),
      ]);
      return { ...page, items: page.items.map((row) => PrismaFavoriteMapper.toDomain(row, placeRatings, eventRatings)) };
    } catch (error) {
      console.error("Error listing favorites:", error);
      throw new DatabaseError("Could not list favorites", error);
    }
  }

  /**
   * One `INSERT ... ON DUPLICATE KEY UPDATE` on the `(userId, placeId)` / `(userId, eventId)` unique
   * indexes, not Prisma's `upsert` (a read plus a write on MariaDB/MySQL): repeated or concurrent adds
   * never fail with P2002 or MariaDB's 1020, and an existing favorite keeps its `createdAt` (see
   * PrismaDeviceRepository.upsertByPushToken). The NULL column of the other kind never collides, since
   * NULLs are not equal in a unique index. Not `INSERT IGNORE`: that would hide foreign key errors.
   * The id and `createdAt` are set here because Prisma's defaults only apply to Prisma writes.
   */
  async add(userId: string, target: FavoriteTarget): Promise<void> {
    const { placeId, eventId } = targetColumns(target);
    try {
      await this.client.$executeRaw`
        INSERT INTO Favorite (id, userId, placeId, eventId, createdAt)
        VALUES (${randomUUID()}, ${userId}, ${placeId}, ${eventId}, UTC_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE id = id
      `;
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw new DatabaseInsertError("Could not add favorite", error);
    }
  }

  async remove(userId: string, target: FavoriteTarget): Promise<void> {
    try {
      await this.client.favorite.deleteMany({ where: { userId, ...this.targetWhere(target) } });
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw new DatabaseError("Could not remove favorite", error);
    }
  }

  async exists(userId: string, target: FavoriteTarget): Promise<boolean> {
    try {
      return (await this.client.favorite.count({ where: { userId, ...this.targetWhere(target) } })) > 0;
    } catch (error) {
      console.error("Error checking favorite:", error);
      throw new DatabaseError("Could not check favorite", error);
    }
  }

  private targetWhere(target: FavoriteTarget): Prisma.FavoriteWhereInput {
    return target.type === "PLACE" ? { placeId: target.id } : { eventId: target.id };
  }
}
