import { NextResponse } from "next/server";

import { getParisHourMinute, getParisYYYYMMDD } from "@/app/lib/paris-time";
import {
  claimCronSendSlot,
  loadReprogramForParisDay,
} from "@/app/lib/reprogram-storage";
import { createRedis } from "@/app/lib/redis-client";
import {
  hasSomeContent,
  sendReprogramReminderToTelegram,
} from "@/app/lib/reprogram-telegram";

export const dynamic = "force-dynamic";

function authorizeCron(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET non défini — refusé en prod");
    return process.env.NODE_ENV !== "production";
  }
  return authHeader === `Bearer ${secret}`;
}

/** Cron Vercel : chaque heure UTC ; déclenché lorsque Paris est à 14h ou 18h. */
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
  const parisDay = getParisYYYYMMDD(now);
  const { hour } = getParisHourMinute(now);

  if (hour !== 14 && hour !== 18) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not-slot",
      parisHour: hour,
      parisDay,
    });
  }

  const dedupeKey = `reprogram-telegram-sent:${parisDay}:slot${hour}`;
  const firstTime = await claimCronSendSlot(dedupeKey, 86400 * 4);
  if (!firstTime) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "already-sent",
      parisDay,
      slot: hour,
    });
  }

  const entry = await loadReprogramForParisDay(parisDay);

  try {
    await sendReprogramReminderToTelegram(parisDay, hour, entry);
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
    parisDay,
    slot: hour,
    hadContent: !!(entry && hasSomeContent(entry)),
  });
}
