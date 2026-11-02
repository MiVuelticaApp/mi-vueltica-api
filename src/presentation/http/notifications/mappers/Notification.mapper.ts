import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { NotificationResponse } from "../responses/NotificationResponse";

export default class NotificationDtoMapper {
  static toResponse(item: NotificationItem): NotificationResponse {
    const { event } = item;
    return {
      id: item.id,
      sentAt: item.sentAt.toISOString(),
      event: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt ? event.endsAt.toISOString() : null,
        placeId: event.placeId,
      },
    };
  }
}
