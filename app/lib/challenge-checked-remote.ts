import { createRedis } from "@/app/lib/redis-client";

const REDIS_KEY = "challenge:checked-days:v1";
const TTL_SEC = 60 * 60 * 24 * 400;

/** Charge les journées cochées depuis Redis (`null` si absent / erreur). */
export async function loadChallengeChecksFromRedis(): Promise<string[] | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(REDIS_KEY);
    if (raw == null) return [];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      return parsed.filter((x): x is string => typeof x === "string");
    }
    if (Array.isArray(raw)) {
      return raw.filter((x): x is string => typeof x === "string");
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveChallengeChecksToRedis(
  sortedUniqueKeys: string[],
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  try {
    await redis.set(REDIS_KEY, sortedUniqueKeys, { ex: TTL_SEC });
    return true;
  } catch {
    return false;
  }
}
