import { describe, expect, it } from "vitest";
import { createRateLimiter, type RateLimitStore } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows the configured count, blocks additional requests, and resets after expiry", async () => {
    const buckets = new Map<string, { count: number; expiresAt: Date }>();
    const store: RateLimitStore = {
      async increment(key, now, expiresAt) {
        let bucket = buckets.get(key);
        if (!bucket || bucket.expiresAt <= now) {
          bucket = { count: 0, expiresAt };
          buckets.set(key, bucket);
        }
        bucket.count += 1;
        return bucket.count;
      },
    };
    let timestamp = 1_000;
    const limit = createRateLimiter(store, {
      limit: 2,
      windowMs: 600_000,
      now: () => timestamp,
    });

    expect(await limit("client-a")).toBe(true);
    expect(await limit("client-a")).toBe(true);
    expect(await limit("client-a")).toBe(false);
    expect(await limit("client-b")).toBe(true);
    timestamp += 600_001;
    expect(await limit("client-a")).toBe(true);
  });
});
