import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { RateLimitModel } from "@/lib/api/rate-limit.model";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * MongoDB-backed fixed-window rate limiter for public write endpoints and
 * login brute-force protection. Correct across multiple serverless
 * instances (Vercel Fluid Compute) — the previous in-memory Map only saw
 * hits landing on the same warm instance, so the effective limit scaled
 * with however many instances happened to be warm. A single atomic
 * aggregation-pipeline update handles the create/reset/increment cases in
 * one round trip (no read-then-write race between concurrent requests), and
 * a TTL index on `resetAt` cleans up expired windows on its own.
 */
export async function checkRateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  await connectToDatabase();

  const now = new Date();
  const newResetAt = new Date(now.getTime() + windowMs);
  const windowExpired = {
    $or: [{ $eq: ["$resetAt", null] }, { $lte: ["$resetAt", now] }],
  };

  const doc = await RateLimitModel.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          count: { $cond: [windowExpired, 1, { $add: ["$count", 1] }] },
          resetAt: { $cond: [windowExpired, newResetAt, "$resetAt"] },
        },
      },
    ],
    { upsert: true, returnDocument: "after", updatePipeline: true },
  );

  const resetAtMs = doc.resetAt.getTime();
  return doc.count <= limit
    ? { allowed: true, remaining: limit - doc.count, resetAt: resetAtMs }
    : { allowed: false, remaining: 0, resetAt: resetAtMs };
}
