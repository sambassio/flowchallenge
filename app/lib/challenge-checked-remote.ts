import {
  CHALLENGE_SEASON_ID,
  challengeChecksRedisKey,
} from "@/app/lib/challenge-calendar-days";
import { createRedis } from "@/app/lib/redis-client";

const TTL_SEC = 60 * 60 * 24 * 400;

function checksKey(): string {
  return challengeChecksRedisKey(CHALLENGE_SEASON_ID);
}

/** Charge les journées cochées depuis Redis (`null` si absent / erreur). */
export async function loadChallengeChecksFromRedis(): Promise<string[] | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(checksKey());
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
    await redis.set(checksKey(), sortedUniqueKeys, { ex: TTL_SEC });
    return true;
  } catch {
    return false;
  }
}
