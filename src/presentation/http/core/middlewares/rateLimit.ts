import { NextFunction, Request, Response } from "express";

// In-memory fixed-window rate limiter. No new dependency: it blunts brute force / spam on a
// few endpoints (test login, account deletion, submission creation), it is not meant to be a
// general-purpose limiter.
//
// Known, accepted limitation: the counter is per-process (a `Map` in module scope), not
// shared between instances behind a load balancer, and resets on every restart/deploy.
interface RateLimitOptions {
  windowMs: number;
  max: number;
  /**
   * What to count by. Defaults to the client IP. Pass e.g. `byUserId` (after `jwtAuth`) to
   * count per authenticated user instead.
   */
  keyGenerator?: (req: Request) => string;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const byIp = (req: Request) => req.ip ?? "unknown";

/** Counts per authenticated user; falls back to the IP if there is no `req.user`. */
export const byUserId = (req: Request) => (req.user ? `user:${req.user.id}` : `ip:${byIp(req)}`);

export default function rateLimit({ windowMs, max, keyGenerator = byIp }: RateLimitOptions) {
  const hits = new Map<string, WindowEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Opportunistically evict expired entries so the map does not grow unbounded.
    for (const [entryKey, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(entryKey);
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.status(429).json({ message: "Demasiados intentos. Intenta de nuevo más tarde." });
      return;
    }

    next();
  };
}
