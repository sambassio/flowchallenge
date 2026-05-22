import { createRedis } from "@/app/lib/redis-client";
import { isValidIanaTimeZone } from "@/app/lib/timezone-wall-clock";

/** Stocke le fuseau IANA choisi depuis le navigateur (rappels 13 h / 21 h locales). */
const REMINDER_TIMEZONE_KEY = "reprogram:reminder-timezone";

const SETTINGS_TTL_SEC = 60 * 60 * 24 * 380;

/** Slug ASCII pour clés Redis de dédoublonnage. */
export function reminderTimeZoneSlugForKey(timeZoneIANA: string): string {
  return timeZoneIANA.trim().replace(/[^a-zA-Z0-9+_-]/g, "_").slice(0, 220);
}

export async function saveReminderTimezone(
  timeZoneIANA: string,
): Promise<boolean> {
  if (!isValidIanaTimeZone(timeZoneIANA)) return false;
  const redis = createRedis();
  if (!redis) return false;
  await redis.set(REMINDER_TIMEZONE_KEY, timeZoneIANA.trim(), {
    ex: SETTINGS_TTL_SEC,
  });
  return true;
}

/** Dernier fuseau persisté depuis le formulaire ; `null` si absent. */
export async function loadReminderTimezone(): Promise<string | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(REMINDER_TIMEZONE_KEY);
    const s = typeof raw === "string" ? raw.trim() : "";
    return s && isValidIanaTimeZone(s) ? s : null;
  } catch {
    return null;
  }
}

/**
 * Fallback « raisonnable » lorsqu’aucun fuseau n’a encore été enregistré
 * pour que le cron ait bien une TZ valide jusqu’à la première visite.
 */
export async function reminderTimeZoneOrDefault(): Promise<string> {
  const t = await loadReminderTimezone();
  return t ?? "Europe/Paris";
}
