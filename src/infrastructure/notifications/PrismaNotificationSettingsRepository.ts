import {
  INotificationSettingsRepository,
  NearbyCandidate,
  NotificationSettings,
} from "@/domain/notifications/repositories/INotificationSettingsRepository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaNotificationSettingsRepository implements INotificationSettingsRepository {
  constructor(private readonly client: Prisma.TransactionClient = prisma) {}

  async get(userId: string): Promise<NotificationSettings | null> {
    const u = await this.client.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { notifyReminders: true, notifyNewNearby: true, notifyMyStatus: true },
    });
    return u ? { reminders: u.notifyReminders, newNearby: u.notifyNewNearby, myStatus: u.notifyMyStatus } : null;
  }

  async update(userId: string, s: NotificationSettings): Promise<void> {
    await this.client.user.update({
      where: { id: userId },
      data: { notifyReminders: s.reminders, notifyNewNearby: s.newNearby, notifyMyStatus: s.myStatus },
    });
  }

  async nearbyCandidates(notSince: Date, limit: number): Promise<NearbyCandidate[]> {
    const rows = await this.client.user.findMany({
      where: {
        deletedAt: null,
        notifyNewNearby: true,
        provinceId: { not: null },
        devices: { some: {} },
        OR: [{ lastNearbyPushAt: null }, { lastNearbyPushAt: { lt: notSince } }],
      },
      select: { id: true, province: { select: { id: true, name: true } } },
      take: limit,
    });
    return rows.filter((r) => r.province).map((r) => ({ userId: r.id, provinceId: r.province!.id, provinceName: r.province!.name }));
  }

  async countNewInProvince(provinceId: number, since: Date): Promise<number> {
    const [places, events] = await Promise.all([
      this.client.place.count({ where: { status: "PUBLISHED", createdAt: { gte: since }, canton: { provinceId } } }),
      this.client.event.count({
        where: {
          status: "PUBLISHED",
          createdAt: { gte: since },
          startsAt: { gte: new Date() },
          // Through the place, or the event's own canton when it has no place (same rule as `GET /events?cantonId=`).
          OR: [{ place: { canton: { provinceId } } }, { placeId: null, canton: { provinceId } }],
        },
      }),
    ]);
    return places + events;
  }

  async markNearbySent(userId: string, at: Date): Promise<void> {
    await this.client.user.update({ where: { id: userId }, data: { lastNearbyPushAt: at } });
  }
}
