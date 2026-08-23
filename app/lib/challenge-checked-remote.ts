import { challengeChecksRedisKey } from "@/app/lib/challenge-calendar-days";
import { createRedis } from "@/app/lib/redis-client";

const TTL_SEC = 60 * 60 * 24 * 400;

/** Charge les journées cochées d’une saison depuis Redis (`null` si absent / erreur). */
export async function loadChallengeChecksFromRedis(
  seasonId: string,
): Promise<string[] | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(challengeChecksRedisKey(seasonId));
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
  seasonId: string,
  sortedUniqueKeys: string[],
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  try {
    await redis.set(challengeChecksRedisKey(seasonId), sortedUniqueKeys, {
      ex: TTL_SEC,
    });
    return true;
  } catch {
    return false;
  }
}
