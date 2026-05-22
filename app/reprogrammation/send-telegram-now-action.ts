"use server";

import "server-only";

import { createRedis } from "@/app/lib/redis-client";
import { saveReminderTimezone } from "@/app/lib/reprogram-settings";
import { loadReprogramForCalendarDay } from "@/app/lib/reprogram-storage";
import {
  hasSomeContent,
  sendReprogramReminderToTelegram,
} from "@/app/lib/reprogram-telegram";
import {
  calendarYYYYMMDDInTimeZone,
  isValidIanaTimeZone,
  wallClockHourMinute,
} from "@/app/lib/timezone-wall-clock";

/** Envoi immédiat Telegram (sans exposer CRON_SECRET au navigateur). */
export async function sendReprogramToTelegramNow(reminderTimeZoneIANA: string): Promise<{
  ok: boolean;
  calendarDay?: string;
  slot?: number;
  hadContent?: boolean;
  message?: string;
}> {
  if (!createRedis()) {
    return {
      ok: false,
      message:
        "Redis non configuré côté serveur : impossible d’envoyer sur Telegram.",
    };
  }

  const trimmed = reminderTimeZoneIANA.trim();
  if (!isValidIanaTimeZone(trimmed)) {
    return {
      ok: false,
      message: "Fuseau horaire invalide (time zone IANA requis).",
    };
  }

  const savedTz = await saveReminderTimezone(trimmed);
  if (!savedTz) {
    return { ok: false, message: "Échec d’enregistrement du fuseau (Redis)." };
  }

  const now = new Date();
  const calendarDay = calendarYYYYMMDDInTimeZone(now, trimmed);
  const { hour } = wallClockHourMinute(now, trimmed);
  const entry = await loadReprogramForCalendarDay(calendarDay);

  try {
    await sendReprogramReminderToTelegram(calendarDay, hour, trimmed, entry);
    return {
      ok: true,
      calendarDay,
      slot: hour,
      hadContent: !!(entry && hasSomeContent(entry)),
    };
  } catch (e) {
    console.error("[reprogram send-now]", e);
    return {
      ok: false,
      message: String(e instanceof Error ? e.message : e),
    };
  }
}
