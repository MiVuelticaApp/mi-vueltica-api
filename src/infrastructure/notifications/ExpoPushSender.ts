import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { IPushSender, PushMessage } from "@/domain/notifications/push/IPushSender";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";

const RECEIPT_DELAY_MS = 15 * 60 * 1000;

/**
 * Sends through Expo's push service (which delivers through FCM / APNs with the keys uploaded to EAS), in
 * batches. `accessToken` is the Expo access token when "enhanced push security" is on (`EXPO_ACCESS_TOKEN`).
 * A token Expo reports as `DeviceNotRegistered` (in the ticket, or in the receipt read 15 minutes later) is
 * deleted from `Device`. Never throws.
 */
export class ExpoPushSender implements IPushSender {
  private readonly expo: Expo;

  constructor(accessToken?: string, private readonly client: Prisma.TransactionClient = prisma) {
    this.expo = new Expo(accessToken ? { accessToken } : {});
  }

  async send(messages: PushMessage[]): Promise<void> {
    try {
      if (messages.length === 0) return;
      const devices = await this.client.device.findMany({
        where: { userId: { in: [...new Set(messages.map((m) => m.userId))] } },
        select: { userId: true, pushToken: true },
      });
      const out: ExpoPushMessage[] = [];
      for (const m of messages) {
        for (const d of devices) {
          if (d.userId !== m.userId || !Expo.isExpoPushToken(d.pushToken)) continue;
          out.push({ to: d.pushToken, title: m.title, body: m.body, data: m.data, sound: "default", channelId: "default" });
        }
      }
      if (out.length === 0) return;

      const receipts: { id: string; token: string }[] = [];
      const gone: string[] = [];
      for (const chunk of this.expo.chunkPushNotifications(out)) {
        let tickets: ExpoPushTicket[];
        try {
          tickets = await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error("[push] send failed:", error);
          continue;
        }
        tickets.forEach((t, i) => {
          const token = chunk[i].to as string;
          if (t.status === "ok") receipts.push({ id: t.id, token });
          else if (t.details?.error === "DeviceNotRegistered") gone.push(token);
          else console.warn(`[push] ticket error: ${t.message}`);
        });
      }
      await this.forget(gone);
      if (receipts.length > 0) {
        const timer = setTimeout(() => void this.checkReceipts(receipts), RECEIPT_DELAY_MS);
        timer.unref();
      }
    } catch (error) {
      console.error("[push] failed:", error);
    }
  }

  private async checkReceipts(sent: { id: string; token: string }[]): Promise<void> {
    try {
      const byId = new Map(sent.map((s) => [s.id, s.token]));
      const gone: string[] = [];
      for (const ids of this.expo.chunkPushNotificationReceiptIds([...byId.keys()])) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(ids);
        for (const [id, r] of Object.entries(receipts)) {
          if (r.status === "error" && r.details?.error === "DeviceNotRegistered") gone.push(byId.get(id)!);
          else if (r.status === "error") console.warn(`[push] receipt error: ${r.message}`);
        }
      }
      await this.forget(gone);
    } catch (error) {
      console.error("[push] receipts failed:", error);
    }
  }

  private async forget(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.client.device.deleteMany({ where: { pushToken: { in: tokens } } });
    console.log(`[push] removed ${tokens.length} unregistered device(s)`);
  }
}
