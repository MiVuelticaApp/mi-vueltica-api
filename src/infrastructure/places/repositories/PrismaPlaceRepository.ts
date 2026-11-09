import { CreatePlanOptions } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { Place, NormalizedPlaceData } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import {
  IPlaceRepository,
  PlaceListFilters,
  RadiusFilter,
} from "@/domain/places/repositories/IPlaceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { planConditionsToColumns, planConditionsWhere } from "@/infrastructure/core/repositories/planConditions";
import { PrismaPlaceMapper } from "../mappers/PrismaPlaceMapper";
import { publishedRatingSummary } from "@/infrastructure/reviews/repositories/ratingSummary";
import { PrismaPhotoMapper } from "@/infrastructure/photos/mappers/PrismaPhotoMapper";
import { withinRadiusSql } from "@/infrastructure/core/repositories/geo";
import { PLAN_AUTHOR_INCLUDE } from "@/infrastructure/core/repositories/planAuthor";
import { COVER_PHOTO_INCLUDE, publishedRatingsFor, toPlanStats } from "@/infrastructure/core/repositories/planStats";
import { PlaceCard } from "@/domain/places/entities/PlaceCard";

export default class PrismaPlaceRepository implements IPlaceRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: PlaceListFilters = {}): Promise<PaginatedResult<PlaceCard>> {
    try {
      const where = await this.buildWhere(filters);
      const page = await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.place.findMany({
              where,
              include: { ...PLAN_AUTHOR_INCLUDE, ...COVER_PHOTO_INCLUDE },
              skip: page.skip,
              take: page.take,
              // `id` as tie-breaker keeps pagination stable when the sort field has duplicates.
              orderBy: [page.orderBy ?? { name: "asc" }, { id: "asc" }] as Prisma.PlaceOrderByWithRelationInput[],
            }),
          count: (tx) => tx.place.count({ where }),
        },
        (row) => ({ row, place: PrismaPlaceMapper.toDomain(row) }),
      );
      // Card stats: the cover came with the page; the ratings of the whole page in one grouped query.
      const ratings = await publishedRatingsFor(this.client, "place", page.items.map((item) => item.place.id));
      return {
        ...page,
        items: page.items.map(({ row, place }) => ({ place, stats: toPlanStats(row, ratings.get(place.id)) })),
      };
    } catch (error) {
      console.error("Error listing places:", error);
      throw new DatabaseError("Could not list places", error);
    }
  }

  async find(id: string): Promise<Place | null> {
    try {
      const row = await this.client.place.findUnique({ where: { id }, include: PLAN_AUTHOR_INCLUDE });
      return row ? PrismaPlaceMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding place:", error);
      throw new DatabaseError("Could not find place", error);
    }
  }

  async findDetail(id: string): Promise<PlaceDetail | null> {
    try {
      const [row, rating] = await Promise.all([
        this.client.place.findUnique({
          where: { id },
          include: { ...PLAN_AUTHOR_INCLUDE, photos: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
        }),
        publishedRatingSummary(this.client, { placeId: id }),
      ]);
      if (!row) return null;
      return {
        place: PrismaPlaceMapper.toDomain(row),
        photos: row.photos.map(PrismaPhotoMapper.toGalleryPhoto),
        rating,
      };
    } catch (error) {
      console.error("Error finding place detail:", error);
      throw new DatabaseError("Could not find place", error);
    }
  }

  async create(data: NormalizedPlaceData, options: CreatePlanOptions = {}): Promise<Place> {
    try {
      const row = await this.client.place.create({
        include: PLAN_AUTHOR_INCLUDE,
        data: {
          cantonId: data.cantonId,
          categoryId: data.categoryId,
          sourceId: data.sourceId,
          name: data.name,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          openingHours: PrismaPlaceMapper.openingHoursToPersistence(data.openingHours),
          targetAudience: data.targetAudience,
          ...planConditionsToColumns(data),
          authorId: options.authorId ?? null,
          status: "PENDING",
        },
      });
      return PrismaPlaceMapper.toDomain(row);
    } catch (error) {
      console.error("Error creating place:", error);
      throw new DatabaseInsertError("Could not create place", error);
    }
  }

  async update(place: Place): Promise<void> {
    try {
      await this.client.place.update({
        where: { id: place.id },
        data: {
          cantonId: place.cantonId,
          categoryId: place.categoryId,
          sourceId: place.sourceId,
          name: place.name,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address,
          openingHours: PrismaPlaceMapper.openingHoursToPersistence(place.openingHours),
          targetAudience: place.targetAudience,
          ...planConditionsToColumns(place),
          status: place.status,
          verifiedAt: place.verifiedAt,
          hiddenReason: place.hiddenReason,
          reportedAt: place.reportedAt,
        },
      });
    } catch (error) {
      console.error("Error updating place:", error);
      throw new DatabaseInsertError("Could not update place", error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.client.place.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting place:", error);
      throw new DatabaseInsertError("Could not delete place", error);
    }
  }

  async cantonExists(id: number): Promise<boolean> {
    try {
      return (await this.client.canton.count({ where: { id } })) > 0;
    } catch (error) {
      console.error("Error checking canton:", error);
      throw new DatabaseError("Could not check canton", error);
    }
  }

  private async buildWhere(filters: PlaceListFilters): Promise<Prisma.PlaceWhereInput> {
    const where: Prisma.PlaceWhereInput = {};

    if (filters.cantonId !== undefined) where.cantonId = filters.cantonId;
    if (filters.provinceId !== undefined) where.canton = { provinceId: filters.provinceId };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.targetAudience) where.targetAudience = filters.targetAudience;
    if (filters.statuses) where.status = { in: filters.statuses };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { address: { contains: filters.search } },
      ];
    }
    const conditions = planConditionsWhere(filters);
    if (conditions.length > 0) where.AND = conditions;

    if (filters.bbox) {
      const { minLat, maxLat, minLng, maxLng } = filters.bbox;
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    } else if (filters.radius) {
      const ids = await this.findIdsWithinRadius(filters.radius);
      where.id = { in: ids };
    }

    return where;
  }

  /**
   * Ids of places within `radiusKm` of the center. The enclosing bounding box narrows the
   * candidates through the (latitude, longitude) index; the Haversine distance then removes
   * the corners of the box. Fully parameterized, never string-built (`withinRadiusSql`).
   */
  private async findIdsWithinRadius(radius: RadiusFilter): Promise<string[]> {
    const rows = await this.client.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM Place WHERE ${withinRadiusSql("latitude", "longitude", radius)}`,
    );
    return rows.map((row) => row.id);
  }
}
