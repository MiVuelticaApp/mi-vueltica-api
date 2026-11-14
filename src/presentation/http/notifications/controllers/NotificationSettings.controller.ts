import { Request, Response } from "express";
import { PushNotifier } from "@/application/notifications/services/PushNotifier";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { UserNotFoundError } from "@/application/users/errors/UserNotFoundError";

/** /me/notification-settings (#10): the three switches of Ajustes › Notificaciones. */
export default class NotificationSettingsController {
  constructor(private readonly notifier: PushNotifier) {}

  async get(req: Request, res: Response): Promise<void> {
    const settings = await this.notifier.getSettings(getAuthUser(req).id);
    if (!settings) throw new UserNotFoundError();
    res.json(settings);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { reminders, newNearby, myStatus } = req.body as { reminders: boolean; newNearby: boolean; myStatus: boolean };
    res.json(await this.notifier.updateSettings(getAuthUser(req).id, { reminders, newNearby, myStatus }));
  }
}
