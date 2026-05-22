import { NextResponse } from "next/server";

import { authorizeCron } from "@/app/lib/cron-authorize";
import {
  reminderTimeZoneOrDefault,
  reminderTimeZoneSlugForKey,
} from "@/app/lib/reprogram-settings";
import {
  claimCronSendSlot,
  loadReprogramForCalendarDay,
} from "@/app/lib/reprogram-storage";
import { createRedis } from "@/app/lib/redis-client";
import {
  hasSomeContent,
  sendReprogramReminderToTelegram,
} from "@/app/lib/reprogram-telegram";
import {
  calendarYYYYMMDDInTimeZone,
  wallClockHourMinute,
} from "@/app/lib/timezone-wall-clock";

export const dynamic = "force-dynamic";

const REMINDER_HOURS = new Set([13, 21]);

/** Cron externe : 13 h & 21 h **heure locale** du fuseau enregistré. `?immediate=1` = envoi maintenant (Bearer CRON_SECRET). */
export async function GET(req: Request) {
  if (!authorizeCron(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!createRedis()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Upstash Redis non configuré (UPSTASH_REDIS_REST_URL / TOKEN).",
      },
      { status: 500 },
    );
  }

  const now = new Date();
  const url = new URL(req.url);
  const immediate = url.searchParams.get("immediate") === "1";

  const timeZoneIANA = await reminderTimeZoneOrDefault();
  const calendarDay = calendarYYYYMMDDInTimeZone(now, timeZoneIANA);
  const { hour } = wallClockHourMinute(now, timeZoneIANA);
  const tzSlug = reminderTimeZoneSlugForKey(timeZoneIANA);

  if (!immediate && !REMINDER_HOURS.has(hour)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not-slot",
      localHour: hour,
      calendarDay,
      timeZoneIANA,
    });
  }

  if (!immediate) {
    const dedupeKey = `reprogram-tg-sent:${calendarDay}:${tzSlug}:slot${hour}`;
    const firstTime = await claimCronSendSlot(dedupeKey, 86400 * 4);
    if (!firstTime) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "already-sent",
        calendarDay,
        slot: hour,
        timeZoneIANA,
      });
    }
  }

  const entry = await loadReprogramForCalendarDay(calendarDay);

  try {
    await sendReprogramReminderToTelegram(
      calendarDay,
      hour,
      timeZoneIANA,
      entry,
    );
  } catch (e) {
    console.error("[cron] telegram failure", e);
    return NextResponse.json(
      { ok: false, error: String(e instanceof Error ? e.message : e) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    calendarDay,
    slot: hour,
    immediate,
    timeZoneIANA,
    hadContent: !!(entry && hasSomeContent(entry)),
  });
}
