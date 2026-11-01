import { NextFunction, Request, Response } from "express";

// In-memory fixed-window rate limiter. No new dependency: it is only meant to blunt brute
// force attempts against the temporary /auth/test-login endpoint (see rateLimit usage in
// auth.route.ts), not to be a general-purpose limiter.
//
// Known, accepted limitation: the counter is per-process (a `Map` in module scope), not
// shared between instances behind a load balancer, and resets on every restart/deploy. That
// is acceptable here because the endpoint it protects is itself temporary and only used
// during App Store / Google Play submission (see AGENTS.md).
interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export default function rateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, WindowEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
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
