import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface INotificationService {
  /** Only notifications whose event is PUBLISHED, newest first by default. */
  listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<NotificationItem>>;
  /** 404 if the notification does not exist or belongs to another user. */
  deleteMine(userId: string, id: string): Promise<void>;
  /**
   * Internal (no HTTP endpoint): records that `userId` was notified about `eventId`.
   * Idempotent: returns true the first time and false if that event was already notified to the
   * user, so the caller knows whether to send the push. Fails if the user or event does not exist.
   */
  notify(userId: string, eventId: string): Promise<boolean>;
}
