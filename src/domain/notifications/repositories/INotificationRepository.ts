import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const NOTIFICATION_SORT_FIELDS = ["sentAt"] as const;

export interface INotificationRepository {
  /**
   * The user's notifications whose event is currently PUBLISHED (listed and counted); the others
   * are hidden, not deleted, and reappear if the event is published again. Default order is
   * `sentAt` descending (newest first).
   */
  listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<NotificationItem>>;
  /**
   * Records that `userId` was notified about `eventId`. Returns false, without failing, when that
   * pair already exists (`@@unique([userId, eventId])`).
   */
  create(userId: string, eventId: string): Promise<boolean>;
  /** Deletes the notification only if it belongs to `userId`. Returns false when nothing was deleted. */
  deleteOwned(id: string, userId: string): Promise<boolean>;
}
