import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

/**
 * Periodically removes uploads nothing references (see `IUploadService.cleanupOrphans`).
 * In-process timer: with several instances each one runs it, which is harmless because every
 * deletion is conditional and idempotent. Timers are `unref`ed so they never keep the process
 * alive. Returns a function that stops the job.
 */
export function startUploadCleanupJob(uploadService: IUploadService, intervalMs = DEFAULT_INTERVAL_MS): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const removed = await uploadService.cleanupOrphans();
      if (removed > 0) console.log(`[uploads] removed ${removed} orphan upload(s)`);
    } catch (error) {
      console.error("[uploads] orphan cleanup failed:", error);
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
