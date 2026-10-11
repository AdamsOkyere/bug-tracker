import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const SUBMISSION_LIMIT = 5;
export const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

export interface RateLimitStore {
  increment(key: string, now: Date, expiresAt: Date): Promise<number>;
}

export function createRateLimiter(
  store: RateLimitStore,
  options: { limit: number; windowMs: number; now?: () => number },
) {
  const now = options.now ?? Date.now;
  return async (key: string): Promise<boolean> => {
    const startedAt = now();
    const count = await store.increment(
      key,
      new Date(startedAt),
      new Date(startedAt + options.windowMs),
    );
    return count <= options.limit;
  };
}

const databaseStore: RateLimitStore = {
  async increment(key, now, expiresAt) {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${key}, 1, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "RateLimitBucket"."expiresAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count"
    `;
    return rows[0].count;
  },
};

const persistentRateLimiter = createRateLimiter(databaseStore, {
  limit: SUBMISSION_LIMIT,
  windowMs: SUBMISSION_WINDOW_MS,
});

export function rateLimitKey(ipAddress: string): string {
  const secret =
    process.env.NEXTAUTH_SECRET ?? "local-development-rate-limit-key";
  return createHmac("sha256", secret).update(ipAddress).digest("hex");
}

export const allowSubmission = persistentRateLimiter;
