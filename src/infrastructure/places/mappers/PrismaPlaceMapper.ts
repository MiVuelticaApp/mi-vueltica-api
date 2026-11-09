import { Place } from "@/domain/places/entities/Place";
import { planConditionsFromColumns } from "@/infrastructure/core/repositories/planConditions";
import { PlanAuthorRow, authorNameFromRow } from "@/infrastructure/core/repositories/planAuthor";
import { Place as PrismaPlace, Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaPlaceMapper {
  /** Load the row with `PLAN_AUTHOR_INCLUDE` so `authorName` can be resolved. */
  static toDomain(row: PrismaPlace & Pick<PlanAuthorRow, "author">): Place {
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
      ...planConditionsFromColumns(row),
      status: row.status,
      verifiedAt: row.verifiedAt,
      authorId: row.authorId,
      authorName: authorNameFromRow(row),
      hiddenReason: row.hiddenReason,
      reportedAt: row.reportedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Nullable JSON columns need `Prisma.DbNull` to store SQL NULL. */
  static openingHoursToPersistence(value: Place["openingHours"]): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}
