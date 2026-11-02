import { Event } from "@/domain/events/entities/Event";

/**
 * Read model for the notifications list: an event the user was notified about and when.
 * There is no Notification entity with behaviour: a notification is only ever created (by
 * `NotificationService.notify`) or deleted, never changed.
 */
export interface NotificationItem {
  id: string;
  userId: string;
  sentAt: Date;
  event: Event;
}
