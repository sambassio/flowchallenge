import type { ReprogrammationEntry } from "@/app/lib/reprogram-types";
import { coerceReprogrammationEntry } from "@/app/lib/reprogram-types";
import { createRedis } from "@/app/lib/redis-client";

const KEY_PREFIX = "reprogram";

export function reprogramRedisKeyCalendarDay(calendarYYYYMMDD: string): string {
  return `${KEY_PREFIX}:${calendarYYYYMMDD}`;
}

/** @deprecated utiliser reprogramRedisKeyCalendarDay */
export function reprogramRedisKeyParisDate(ymd: string): string {
  return reprogramRedisKeyCalendarDay(ymd);
}

export async function saveReprogramForCalendarDay(
  calendarYYYYMMDD: string,
  entry: ReprogrammationEntry,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  await redis.set(reprogramRedisKeyCalendarDay(calendarYYYYMMDD), entry, {
    ex: 60 * 60 * 24 * 120,
  });
  return true;
}

/** @deprecated alias pour compat */
export async function saveReprogramForParisDay(
  ymd: string,
  entry: ReprogrammationEntry,
): Promise<boolean> {
  return saveReprogramForCalendarDay(ymd, entry);
}

export async function loadReprogramForCalendarDay(
  calendarYYYYMMDD: string,
): Promise<ReprogrammationEntry | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    /** Upstash peut renvoyer une string JSON ou l’objet déjà parsé. */
    const raw: unknown = await redis.get(
      reprogramRedisKeyCalendarDay(calendarYYYYMMDD),
    );
    if (raw == null) return null;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as unknown;
      return coerceReprogrammationEntry(parsed);
    }
    if (typeof raw === "object") {
      return coerceReprogrammationEntry(raw);
    }
  } catch {
    return null;
  }
  return null;
}

/** @deprecated alias */
export async function loadReprogramForParisDay(
  ymd: string,
): Promise<ReprogrammationEntry | null> {
  return loadReprogramForCalendarDay(ymd);
}

/** `true` si la clé n'existait pas (premier passage). */
export async function claimCronSendSlot(
  key: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  const reply = await redis.set(key, "1", { ex: ttlSeconds, nx: true });
  return reply === "OK";
}
