import { Event } from "@/domain/events/entities/Event";
import { EventListItem, PlaceSummary, toEventListItem } from "@/domain/events/entities/EventDetail";
import { planConditionsFromColumns } from "@/infrastructure/core/repositories/planConditions";
import { PlanAuthorRow, authorNameFromRow } from "@/infrastructure/core/repositories/planAuthor";
import { Event as PrismaEvent, Place as PrismaPlace } from "@/infrastructure/prisma/generated/prisma/client";

export type PrismaEventRow = PrismaEvent & Pick<PlanAuthorRow, "author">;
export type PrismaEventWithPlace = PrismaEventRow & { place: PrismaPlace | null };

export class PrismaEventMapper {
  /** Load the row with `PLAN_AUTHOR_INCLUDE` so `authorName` can be resolved. */
  static toDomain(row: PrismaEventRow): Event {
    return new Event({
      id: row.id,
      placeId: row.placeId,
      categoryId: row.categoryId,
      sourceId: row.sourceId,
      title: row.title,
      description: row.description,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      // Prisma `Decimal` -> number (same as Place).
      latitude: row.latitude ? row.latitude.toNumber() : null,
      longitude: row.longitude ? row.longitude.toNumber() : null,
      address: row.address,
      targetAudience: row.targetAudience,
      ...planConditionsFromColumns(row),
      status: row.status,
      authorId: row.authorId,
      authorName: authorNameFromRow(row),
      hiddenReason: row.hiddenReason,
      reportedAt: row.reportedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** The event plus its place summary and resolved location (no visibility rule applied). */
  static toListItem(row: PrismaEventWithPlace): EventListItem {
    return toEventListItem(
      PrismaEventMapper.toDomain(row),
      row.place ? PrismaEventMapper.placeSummaryToDomain(row.place) : null,
    );
  }

  static placeSummaryToDomain(row: PrismaPlace): PlaceSummary {
    return {
      id: row.id,
      name: row.name,
      cantonId: row.cantonId,
      latitude: row.latitude.toNumber(),
      longitude: row.longitude.toNumber(),
      address: row.address,
      status: row.status,
    };
  }
}
