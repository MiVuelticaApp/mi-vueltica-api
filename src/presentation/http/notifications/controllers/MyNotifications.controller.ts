import { Request, Response } from "express";
import { z } from "zod";
import { INotificationService } from "@/application/notifications/services/interfaces/INotificationService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListNotificationsQuerySchema } from "../validators/listNotifications";
import NotificationDtoMapper from "../mappers/Notification.mapper";

type ListQuery = z.output<typeof ListNotificationsQuerySchema>;
type IdParams = { id: string };

/** /me/notifications — events the authenticated user was notified about. No create endpoint. */
export default class MyNotificationsController {
  constructor(private readonly notificationService: INotificationService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.notificationService.listMine(userId, toPaginationParams(query));
    res.json(toPaginatedResponse(result, NotificationDtoMapper.toResponse));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    await this.notificationService.deleteMine(userId, id);
    res.status(204).send();
  }
}
