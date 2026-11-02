import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { INotificationRepository } from "@/domain/notifications/repositories/INotificationRepository";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { INotificationService } from "../interfaces/INotificationService";
import { NotificationNotFoundError } from "../../errors/NotificationNotFoundError";

const DEFAULT_SORT = { field: "sentAt", direction: "desc" as SortDirection };

export class NotificationService implements INotificationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<NotificationItem>> {
    return this.notificationRepository.listForUser(userId, { ...params, sort: params.sort ?? DEFAULT_SORT });
  }

  async deleteMine(userId: string, id: string): Promise<void> {
    // Scoped by userId: someone else's notification is a 404, so its existence is not revealed.
    const deleted = await this.notificationRepository.deleteOwned(id, userId);
    if (!deleted) throw new NotificationNotFoundError();
  }

  async notify(userId: string, eventId: string): Promise<boolean> {
    return this.notificationRepository.create(userId, eventId);
  }
}
