import {
  CHALLENGE_SEASON_ID,
  getLegacyChallengeDayKeys,
  LEGACY_CHALLENGE_REDIS_CHECKS_KEY,
  LEGACY_CHALLENGE_SEASON_ID,
  TOTAL_DAYS,
} from "@/app/lib/challenge-calendar-days";
import { createRedis } from "@/app/lib/redis-client";

const REDIS_KEY = "challenge:completions:v1";
const TTL_SEC = 60 * 60 * 24 * 400;

export type ChallengeCompletionsRecord = {
  seasons: string[];
};

function normalizeRecord(raw: unknown): ChallengeCompletionsRecord {
  if (raw == null) return { seasons: [] };
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { seasons: [] };
    }
  }
  if (!parsed || typeof parsed !== "object") return { seasons: [] };
  const o = parsed as Record<string, unknown>;
  const seasonsRaw = o.seasons;
  if (!Array.isArray(seasonsRaw)) return { seasons: [] };
  const seasons = [
    ...new Set(
      seasonsRaw.filter((s): s is string => typeof s === "string" && s.length > 0),
    ),
  ].sort();
  return { seasons };
}

export async function loadChallengeCompletionsFromRedis(): Promise<ChallengeCompletionsRecord | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(REDIS_KEY);
    if (raw == null) return { seasons: [] };
    return normalizeRecord(raw);
  } catch {
    return null;
  }
}

export async function saveChallengeCompletionsToRedis(
  record: ChallengeCompletionsRecord,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  try {
    const seasons = [...new Set(record.seasons)].sort();
    await redis.set(REDIS_KEY, { seasons }, { ex: TTL_SEC });
    return true;
  } catch {
    return false;
  }
}

/** Idempotent : une saison ne compte qu’une fois. */
export async function markChallengeSeasonCompleteInRedis(
  seasonId: string,
): Promise<ChallengeCompletionsRecord | null> {
  const redis = createRedis();
  if (!redis) return null;
  const current = (await loadChallengeCompletionsFromRedis()) ?? { seasons: [] };
  if (current.seasons.includes(seasonId)) return current;
  const next = { seasons: [...current.seasons, seasonId].sort() };
  const ok = await saveChallengeCompletionsToRedis(next);
  return ok ? next : null;
}

function isFullSeason(keys: string[], allowed: string[]): boolean {
  if (allowed.length !== TOTAL_DAYS) return false;
  const set = new Set(keys);
  return allowed.every((k) => set.has(k));
}

/** Crédite la victoire mai 2026 si l’ancienne clé Redis avait 31/31. */
export async function migrateLegacyChallengeCompletionIfNeeded(): Promise<ChallengeCompletionsRecord | null> {
  const redis = createRedis();
  if (!redis) return null;

  const current = (await loadChallengeCompletionsFromRedis()) ?? { seasons: [] };
  if (current.seasons.includes(LEGACY_CHALLENGE_SEASON_ID)) {
    return current;
  }

  try {
    const raw: unknown = await redis.get(LEGACY_CHALLENGE_REDIS_CHECKS_KEY);
    let keys: string[] = [];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        keys = parsed.filter((x): x is string => typeof x === "string");
      }
    } else if (Array.isArray(raw)) {
      keys = raw.filter((x): x is string => typeof x === "string");
    }

    const legacyAllowed = getLegacyChallengeDayKeys();
    if (!isFullSeason(keys, legacyAllowed)) return current;

    return markChallengeSeasonCompleteInRedis(LEGACY_CHALLENGE_SEASON_ID);
  } catch {
    return null;
  }
}

export function completionCount(record: ChallengeCompletionsRecord): number {
  return record.seasons.length;
}

export { CHALLENGE_SEASON_ID };
