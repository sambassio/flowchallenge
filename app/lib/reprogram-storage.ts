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
  await redis.set(reprogramRedisKeyParisDate(parisYYYYMMDD), entry, {
    ex: 60 * 60 * 24 * 120,
  });
  return true;
}

export async function loadReprogramForParisDay(
  parisYYYYMMDD: string,
): Promise<ReprogrammationEntry | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    /** Upstash peut renvoyer une string JSON ou l’objet déjà parsé. */
    const raw: unknown = await redis.get(reprogramRedisKeyParisDate(parisYYYYMMDD));
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
