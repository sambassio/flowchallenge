import type { ReprogrammationEntry } from "@/app/lib/reprogram-types";
import { coerceReprogrammationEntry } from "@/app/lib/reprogram-types";
import { createRedis } from "@/app/lib/redis-client";

const KEY_PREFIX = "reprogram";

export function reprogramRedisKeyParisDate(parisYYYYMMDD: string): string {
  return `${KEY_PREFIX}:${parisYYYYMMDD}`;
}

export async function saveReprogramForParisDay(
  parisYYYYMMDD: string,
  entry: ReprogrammationEntry,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  await redis.set(
    reprogramRedisKeyParisDate(parisYYYYMMDD),
    JSON.stringify(entry),
    { ex: 60 * 60 * 24 * 120 },
  );
  return true;
}

export async function loadReprogramForParisDay(
  parisYYYYMMDD: string,
): Promise<ReprogrammationEntry | null> {
  const redis = createRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(reprogramRedisKeyParisDate(parisYYYYMMDD));
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return coerceReprogrammationEntry(parsed);
  } catch {
    return null;
  }
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
