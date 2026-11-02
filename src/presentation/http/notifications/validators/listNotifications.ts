import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { NOTIFICATION_SORT_FIELDS } from "@/domain/notifications/repositories/INotificationRepository";

export { NOTIFICATION_SORT_FIELDS };

/** GET /me/notifications — newest first by default. */
export const ListNotificationsQuerySchema = createPaginationQuerySchema(NOTIFICATION_SORT_FIELDS);
