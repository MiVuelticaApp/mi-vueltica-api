import { IPushSender } from "@/domain/notifications/push/IPushSender";
import { INotificationSettingsRepository, NotificationSettings } from "@/domain/notifications/repositories/INotificationSettingsRepository";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NEARBY_BATCH = 500;

/** A decided suggestion, for "Estado de mis vuelticas". `created` is set when it was published. */
export interface SubmissionDecision {
  authorId: string;
  name: string;
  published: boolean;
  created?: { type: "PLACE" | "EVENT"; id: string } | null;
}

/**
 * The server pushes (#10): "Estado de mis vuelticas" when a suggestion is decided (moderator or community vote)
 * and the weekly "Planes nuevos cerca" by province. Each respects the user's switch. Best effort: never throws,
 * so a push problem never fails the request or the job that triggered it.
 */
export class PushNotifier {
  constructor(
    private readonly sender: IPushSender,
    private readonly settings: INotificationSettingsRepository,
  ) {}

  getSettings(userId: string): Promise<NotificationSettings | null> {
    return this.settings.get(userId);
  }

  async updateSettings(userId: string, s: NotificationSettings): Promise<NotificationSettings> {
    await this.settings.update(userId, s);
    return s;
  }

  async submissionDecided(d: SubmissionDecision): Promise<void> {
    try {
      const s = await this.settings.get(d.authorId);
      if (!s?.myStatus) return;
      const name = d.name.trim() || "Tu vueltica";
      // The app opens `vuelticaId` (`p-<uuid>` / `e-<uuid>`) or, with `screen: "mine"`, Mis vuelticas.
      const data: Record<string, string> =
        d.published && d.created ? { vuelticaId: `${d.created.type === "PLACE" ? "p" : "e"}-${d.created.id}` } : { screen: "mine" };
      await this.sender.send([
        {
          userId: d.authorId,
          title: d.published ? "¡Tu vueltica se publicó!" : "Tu sugerencia no se publicó",
          body: d.published ? `"${name}" ya está en el mapa. ¡Gracias por aportar!` : `"${name}" fue revisada. Mirá el motivo en Mis vuelticas.`,
          data,
        },
      ]);
    } catch (error) {
      console.error("[push] submission decision failed:", error);
    }
  }

  /** At most once a week per user: how many plans were published in their province in the last 7 days. */
  async sendWeeklyNearby(now = new Date()): Promise<number> {
    let sent = 0;
    try {
      const weekAgo = new Date(now.getTime() - WEEK_MS);
      const candidates = await this.settings.nearbyCandidates(weekAgo, NEARBY_BATCH);
      const counts = new Map<number, number>();
      for (const c of candidates) {
        if (!counts.has(c.provinceId)) counts.set(c.provinceId, await this.settings.countNewInProvince(c.provinceId, weekAgo));
        const n = counts.get(c.provinceId)!;
        // Marked even with nothing new, so the user is checked again next week rather than every run.
        await this.settings.markNearbySent(c.userId, now);
        if (n === 0) continue;
        await this.sender.send([
          {
            userId: c.userId,
            title: "Planes nuevos cerca",
            body: n === 1 ? `Hay 1 plan nuevo en ${c.provinceName} esta semana.` : `Hay ${n} planes nuevos en ${c.provinceName} esta semana.`,
            data: { url: "/" },
          },
        ]);
        sent++;
      }
    } catch (error) {
      console.error("[push] weekly nearby failed:", error);
    }
    return sent;
  }
}
