import type { RequestHandler } from "express";
import { securityEvent } from "./events";

/** Supplementary process-local limit. No untrusted forwarded-IP trust or durable guarantee. */
export function rateLimit(
  limit: number,
  windowMs: number,
  now = Date.now
): RequestHandler {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const timestamp = now();
    for (const [key, bucket] of buckets)
      if (bucket.reset <= timestamp) buckets.delete(key);
    // Behind an unconfigured proxy this is the proxy IP: conservative, possibly shared.
    const key = req.socket.remoteAddress ?? "unknown";
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 10000) {
        res.status(429).json({
          error: { code: "RATE_LIMITED", message: "Please try again later" },
        });
        return;
      }
      bucket = { count: 0, reset: timestamp + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > limit) {
      securityEvent(
        "request.rate_limited",
        String(res.getHeader("X-Request-ID") ?? "")
      );
      res.setHeader(
        "Retry-After",
        String(Math.ceil((bucket.reset - timestamp) / 1000))
      );
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Please try again later" },
      });
      return;
    }
    next();
  };
}
