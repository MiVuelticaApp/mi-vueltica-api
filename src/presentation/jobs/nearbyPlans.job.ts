import { PushNotifier } from "@/application/notifications/services/PushNotifier";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;

/**
 * Weekly "Planes nuevos cerca" push (#10). Runs every 6 hours; each user gets it at most once a week
 * (`User.lastNearbyPushAt`). In-process timer like the upload cleanup: with several instances a user could
 * rarely get it twice in the same run window. Timers are `unref`ed. Returns a function that stops the job.
 */
export function startNearbyPlansJob(notifier: PushNotifier, intervalMs = DEFAULT_INTERVAL_MS): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const sent = await notifier.sendWeeklyNearby();
      if (sent > 0) console.log(`[push] sent ${sent} "planes nuevos cerca" push(es)`);
    } finally {
      running = false;
    }
  };
  const first = setTimeout(run, FIRST_RUN_DELAY_MS);
  const timer = setInterval(run, intervalMs);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
