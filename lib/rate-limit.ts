import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
const buckets = new Map<string, number[]>();

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    throw new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again later.", {
      retryAfter,
    });
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v[v.length - 1] > 60 * 60 * 1000) buckets.delete(k);
    }
  }
}
