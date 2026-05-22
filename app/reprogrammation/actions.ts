"use server";

import "server-only";

import type { ReprogrammationEntry } from "@/app/lib/reprogram-types";
import {
  coerceReprogrammationEntry,
  reprogrammationHasContent,
} from "@/app/lib/reprogram-types";
import { saveReminderTimezone } from "@/app/lib/reprogram-settings";
import {
  loadReprogramForCalendarDay,
  saveReprogramForCalendarDay,
} from "@/app/lib/reprogram-storage";
import { createRedis } from "@/app/lib/redis-client";
import {
  calendarYYYYMMDDInTimeZone,
  isValidIanaTimeZone,
} from "@/app/lib/timezone-wall-clock";

const MAX_FIELD = 3800;

function clamp(entry: ReprogrammationEntry): ReprogrammationEntry {
  const clip = (s: string) => s.slice(0, MAX_FIELD);
  return {
    identity: clip(entry.identity),
    gratitude: clip(entry.gratitude),
    program: clip(entry.program),
    deepFocusGoal: clip(entry.deepFocusGoal),
    avoid: clip(entry.avoid),
    pursue: clip(entry.pursue),
  };
}

/** Lit la journée courante depuis Redis (même clé jour calendaire que l’envoi Telegram). */
export async function fetchReprogrammationFromCloud(
  reminderTimeZoneIANA: string,
): Promise<{
  ok: boolean;
  cloudConfigured: boolean;
  entry: ReprogrammationEntry | null;
  calendarDay?: string;
  message?: string;
}> {
  const tzTrim = (reminderTimeZoneIANA ?? "").trim();

  if (!isValidIanaTimeZone(tzTrim)) {
    return {
      ok: false,
      cloudConfigured: false,
      entry: null,
      message:
        "Fuseau horaire invalide (vérifie la date système du navigateur).",
    };
  }

  if (!createRedis()) {
    return {
      ok: true,
      cloudConfigured: false,
      entry: null,
      calendarDay: calendarYYYYMMDDInTimeZone(new Date(), tzTrim),
    };
  }

  try {
    const calendarDay = calendarYYYYMMDDInTimeZone(new Date(), tzTrim);
    const loaded = await loadReprogramForCalendarDay(calendarDay);

    const entry =
      loaded && reprogrammationHasContent(loaded) ? loaded : null;

    return { ok: true, cloudConfigured: true, entry, calendarDay };
  } catch (e) {
    console.error("[reprogram fetch cloud]", e);
    return {
      ok: false,
      cloudConfigured: true,
      entry: null,
      message: "Impossible de lire la reprogrammation depuis Redis.",
    };
  }
}

/**
 * Persiste le texte pour le jour calendaire dans le fuseau `reminderTimeZoneIANA`
 * et enregistre ce fuseau pour les rappels automatiques à 13 h / 21 h locales.
 */
export async function persistReprogrammationForTelegram(
  payload: unknown,
  reminderTimeZoneIANA: string,
): Promise<{
  ok: boolean;
  stored: boolean;
  calendarDay?: string;
  timezone?: string;
  message?: string;
}> {
  const tzTrim = (reminderTimeZoneIANA ?? "").trim();

  try {
    if (!isValidIanaTimeZone(tzTrim)) {
      return {
        ok: false,
        stored: false,
        message:
          "Fuseau horaire invalide (vérifie la date système du navigateur).",
      };
    }

    const entry = clamp(coerceReprogrammationEntry(payload));
    const redisAvail = !!createRedis();
    const calendarDay = calendarYYYYMMDDInTimeZone(new Date(), tzTrim);

    if (!redisAvail) {
      return {
        ok: true,
        stored: false,
        calendarDay,
        timezone: tzTrim,
        message:
          "Redis non configuré sur ce déploiement : texte seulement sur cet appareil. Les télégrammes liront Redis de la prod (flowchallenge-alpha) — utilise ce domaine avec variables Upstash.",
      };
    }

    const tzSaved = await saveReminderTimezone(tzTrim);
    if (!tzSaved) {
      return {
        ok: false,
        stored: false,
        calendarDay,
        timezone: tzTrim,
        message: "Impossible d’enregistrer le fuseau sur Redis.",
      };
    }

    const stored = await saveReprogramForCalendarDay(calendarDay, entry);

    return {
      ok: true,
      stored,
      calendarDay,
      timezone: tzTrim,
      message: stored
        ? undefined
        : "Écriture Redis de la journée impossible (vérifie les variables serveur).",
    };
  } catch (e) {
    console.error("[reprogram persist]", e);
    return {
      ok: false,
      stored: false,
      ...(isValidIanaTimeZone(tzTrim)
        ? {
            calendarDay: calendarYYYYMMDDInTimeZone(new Date(), tzTrim),
            timezone: tzTrim,
          }
        : {}),
      message:
        "Échec de la synchro cloud (voir logs). Le texte local est quand même enregistré.",
    };
  }
}
