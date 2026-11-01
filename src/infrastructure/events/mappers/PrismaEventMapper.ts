import { Event } from "@/domain/events/entities/Event";
import { PlaceSummary } from "@/domain/events/entities/EventDetail";
import { Event as PrismaEvent, Place as PrismaPlace } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaEventMapper {
  static toDomain(row: PrismaEvent): Event {
    return new Event({
      id: row.id,
      placeId: row.placeId,
      categoryId: row.categoryId,
      sourceId: row.sourceId,
      title: row.title,
      description: row.description,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      targetAudience: row.targetAudience,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
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
