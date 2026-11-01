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
import { PrismaPlaceMapper } from "../mappers/PrismaPlaceMapper";

const KM_PER_DEGREE = 111.32;
const EARTH_RADIUS_KM = 6371;

export default class PrismaPlaceRepository implements IPlaceRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: PlaceListFilters = {}): Promise<PaginatedResult<Place>> {
    try {
      const where = await this.buildWhere(filters);
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.place.findMany({
              where,
              skip: page.skip,
              take: page.take,
              // `id` as tie-breaker keeps pagination stable when the sort field has duplicates.
              orderBy: [page.orderBy ?? { name: "asc" }, { id: "asc" }] as Prisma.PlaceOrderByWithRelationInput[],
            }),
          count: (tx) => tx.place.count({ where }),
        },
        PrismaPlaceMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing places:", error);
      throw new DatabaseError("Could not list places", error);
    }
  }

  async find(id: string): Promise<Place | null> {
    try {
      const row = await this.client.place.findUnique({ where: { id } });
      return row ? PrismaPlaceMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding place:", error);
      throw new DatabaseError("Could not find place", error);
    }
  }

  async findDetail(id: string): Promise<PlaceDetail | null> {
    try {
      const [row, ratings] = await Promise.all([
        this.client.place.findUnique({
          where: { id },
          include: { photos: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
        }),
        this.client.review.aggregate({
          _avg: { rating: true },
          _count: { _all: true },
          where: { placeId: id, status: "PUBLISHED" },
        }),
      ]);
      if (!row) return null;
      return {
        place: PrismaPlaceMapper.toDomain(row),
        photos: row.photos.map(PrismaPlaceMapper.photoToDomain),
        rating: { average: ratings._avg.rating ?? null, count: ratings._count._all },
      };
    } catch (error) {
      console.error("Error finding place detail:", error);
      throw new DatabaseError("Could not find place", error);
    }
  }

  async create(data: NormalizedPlaceData): Promise<Place> {
    try {
      const row = await this.client.place.create({
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
          status: place.status,
          verifiedAt: place.verifiedAt,
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
   * the corners of the box. Fully parameterized (tagged template), never string-built.
   */
  private async findIdsWithinRadius({ lat, lng, radiusKm }: RadiusFilter): Promise<string[]> {
    const deltaLat = radiusKm / KM_PER_DEGREE;
    const minLat = Math.max(-90, lat - deltaLat);
    const maxLat = Math.min(90, lat + deltaLat);
    // Near the poles a degree of longitude shrinks to nothing: drop the longitude bounds there.
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const deltaLng = cosLat < 1e-6 ? 360 : radiusKm / (KM_PER_DEGREE * cosLat);
    const minLng = deltaLng >= 180 ? -180 : lng - deltaLng;
    const maxLng = deltaLng >= 180 ? 180 : lng + deltaLng;

    const rows = await this.client.$queryRaw<{ id: string }[]>`
      SELECT id FROM Place
      WHERE latitude BETWEEN ${minLat} AND ${maxLat}
        AND longitude BETWEEN ${minLng} AND ${maxLng}
        AND ${EARTH_RADIUS_KM} * ACOS(LEAST(1, GREATEST(-1,
              COS(RADIANS(${lat})) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(${lng}))
              + SIN(RADIANS(${lat})) * SIN(RADIANS(latitude))
            ))) <= ${radiusKm}
    `;
    return rows.map((row) => row.id);
  }
}
