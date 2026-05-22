"use server";

import "server-only";

import { getAllChallengeDayKeys } from "@/app/lib/challenge-calendar-days";
import {
  loadChallengeChecksFromRedis,
  saveChallengeChecksToRedis,
} from "@/app/lib/challenge-checked-remote";
import { createRedis } from "@/app/lib/redis-client";

function sanitizeKeys(keys: string[]): string[] {
  const allowed = new Set(getAllChallengeDayKeys());
  const dayRe = /^\d{4}-\d{2}-\d{2}$/;
  const next = new Set<string>();
  for (const k of keys) {
    if (typeof k !== "string" || !dayRe.test(k) || !allowed.has(k)) continue;
    next.add(k);
  }
  return [...next].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** États journées pour synchro téléphone ↔ ordinateur (Upstash Redis). */
export async function fetchChallengeChecksFromCloud(): Promise<{
  ok: boolean;
  keys: string[];
  cloudConfigured: boolean;
}> {
  if (!createRedis()) {
    return { ok: true, keys: [], cloudConfigured: false };
  }

  try {
    const raw = await loadChallengeChecksFromRedis();
    if (raw === null) {
      return { ok: false, keys: [], cloudConfigured: true };
    }
    return { ok: true, keys: sanitizeKeys(raw), cloudConfigured: true };
  } catch {
    return { ok: false, keys: [], cloudConfigured: true };
  }
}

export async function persistChallengeChecksToCloud(
  keys: string[],
): Promise<{ ok: boolean; stored: boolean }> {
  if (!createRedis()) {
    return { ok: false, stored: false };
  }
  const clean = sanitizeKeys(keys);
  const stored = await saveChallengeChecksToRedis(clean);
  return { ok: true, stored };
}
