import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { PrismaEventMapper } from "@/infrastructure/events/mappers/PrismaEventMapper";
import { Event as PrismaEvent, Notification as PrismaNotification } from "@/infrastructure/prisma/generated/prisma/client";

export type PrismaNotificationWithEvent = PrismaNotification & { event: PrismaEvent };

export class PrismaNotificationMapper {
  static toDomain(row: PrismaNotificationWithEvent): NotificationItem {
    return {
      id: row.id,
      userId: row.userId,
      sentAt: row.sentAt,
      event: PrismaEventMapper.toDomain(row.event),
    };
  }
}
