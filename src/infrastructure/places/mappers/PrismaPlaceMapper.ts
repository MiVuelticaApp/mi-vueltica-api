import { Place } from "@/domain/places/entities/Place";
import { PlacePhoto } from "@/domain/places/entities/PlaceDetail";
import { Place as PrismaPlace, Photo as PrismaPhoto, Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaPlaceMapper {
  static toDomain(row: PrismaPlace): Place {
    return new Place({
      id: row.id,
      cantonId: row.cantonId,
      categoryId: row.categoryId,
      sourceId: row.sourceId,
      name: row.name,
      description: row.description,
      latitude: row.latitude.toNumber(),
      longitude: row.longitude.toNumber(),
      address: row.address,
      // The domain value object re-validates and types the stored JSON.
      openingHours: row.openingHours,
      targetAudience: row.targetAudience,
      status: row.status,
      verifiedAt: row.verifiedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static photoToDomain(row: PrismaPhoto): PlacePhoto {
    return { id: row.id, url: row.url, position: row.position };
  }

  /** Nullable JSON columns need `Prisma.DbNull` to store SQL NULL. */
  static openingHoursToPersistence(value: Place["openingHours"]): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
