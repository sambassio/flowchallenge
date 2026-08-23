"use server";

import "server-only";

import {
  ChallengeDefinition,
  dayKeysFromStartKey,
  sanitizeChallengeDefinition,
} from "@/app/lib/challenge-calendar-days";
import {
  loadActiveChallengeFromRedis,
  loadChallengeDefinitionsFromRedis,
  saveActiveChallengeToRedis,
  upsertChallengeDefinitionInRedis,
  type ChallengeDefinitionsRegistry,
} from "@/app/lib/challenge-active-remote";
import {
  loadChallengeChecksFromRedis,
  saveChallengeChecksToRedis,
} from "@/app/lib/challenge-checked-remote";
import {
  completionCount,
  loadChallengeCompletionsFromRedis,
  markChallengeSeasonCompleteInRedis,
  migrateLegacyChallengeCompletionIfNeeded,
  saveChallengeCompletionsToRedis,
} from "@/app/lib/challenge-completion-remote";
import { createRedis } from "@/app/lib/redis-client";

function sanitizeKeys(seasonId: string, keys: string[]): string[] {
  const allowed = new Set(dayKeysFromStartKey(seasonId));
  const dayRe = /^\d{4}-\d{2}-\d{2}$/;
  const next = new Set<string>();
  for (const k of keys) {
    if (typeof k !== "string" || !dayRe.test(k) || !allowed.has(k)) continue;
    next.add(k);
  }
  return [...next].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** États journées pour synchro téléphone ↔ ordinateur (Upstash Redis). */
export async function fetchChallengeChecksFromCloud(seasonId: string): Promise<{
  ok: boolean;
  keys: string[];
  cloudConfigured: boolean;
}> {
  if (!createRedis()) {
    return { ok: true, keys: [], cloudConfigured: false };
  }

  try {
    const raw = await loadChallengeChecksFromRedis(seasonId);
    if (raw === null) {
      return { ok: false, keys: [], cloudConfigured: true };
    }
    return { ok: true, keys: sanitizeKeys(seasonId, raw), cloudConfigured: true };
  } catch {
    return { ok: false, keys: [], cloudConfigured: true };
  }
}

export async function persistChallengeChecksToCloud(
  seasonId: string,
  keys: string[],
): Promise<{ ok: boolean; stored: boolean }> {
  if (!createRedis()) {
    return { ok: false, stored: false };
  }
  const clean = sanitizeKeys(seasonId, keys);
  const stored = await saveChallengeChecksToRedis(seasonId, clean);
  return { ok: true, stored };
}

/** Badges « challenge cleared » (saisons terminées), avec migration mai 2026. */
export async function fetchChallengeCompletions(): Promise<{
  ok: boolean;
  count: number;
  seasons: string[];
  cloudConfigured: boolean;
}> {
  if (!createRedis()) {
    return { ok: true, count: 0, seasons: [], cloudConfigured: false };
  }

  try {
    await migrateLegacyChallengeCompletionIfNeeded();
    const record =
      (await loadChallengeCompletionsFromRedis()) ?? { seasons: [] };
    return {
      ok: true,
      count: completionCount(record),
      seasons: record.seasons,
      cloudConfigured: true,
    };
  } catch {
    return { ok: false, count: 0, seasons: [], cloudConfigured: true };
  }
}

/** Enregistre la victoire d’une saison (idempotent). */
export async function markChallengeSeasonComplete(seasonId: string): Promise<{
  ok: boolean;
  count: number;
  stored: boolean;
}> {
  if (!createRedis()) {
    return { ok: false, count: 0, stored: false };
  }

  try {
    const next = await markChallengeSeasonCompleteInRedis(seasonId);
    if (!next) {
      return { ok: false, count: 0, stored: false };
    }
    return {
      ok: true,
      count: completionCount(next),
      stored: true,
    };
  } catch {
    return { ok: false, count: 0, stored: false };
  }
}

/** Fusionne des saisons complétées côté client (secours sans Redis). */
export async function mergeChallengeCompletionsFromClient(
  localSeasons: string[],
): Promise<{ ok: boolean; count: number; seasons: string[] }> {
  const clean = [
    ...new Set(
      localSeasons.filter((s) => typeof s === "string" && s.length > 0),
    ),
  ].sort();

  if (!createRedis()) {
    return { ok: true, count: clean.length, seasons: clean };
  }

  try {
    await migrateLegacyChallengeCompletionIfNeeded();
    const current =
      (await loadChallengeCompletionsFromRedis()) ?? { seasons: [] };
    const merged = [...new Set([...current.seasons, ...clean])].sort();
    if (merged.length !== current.seasons.length) {
      await saveChallengeCompletionsToRedis({ seasons: merged });
    }
    return { ok: true, count: merged.length, seasons: merged };
  } catch {
    return { ok: false, count: clean.length, seasons: clean };
  }
}

/** Challenge actif stocké dans le cloud (titre + règles + date de départ). */
export async function fetchActiveChallenge(): Promise<{
  ok: boolean;
  cloudConfigured: boolean;
  challenge: ChallengeDefinition | null;
}> {
  if (!createRedis()) {
    return { ok: true, cloudConfigured: false, challenge: null };
  }
  try {
    const challenge = await loadActiveChallengeFromRedis();
    return { ok: true, cloudConfigured: true, challenge };
  } catch {
    return { ok: false, cloudConfigured: true, challenge: null };
  }
}

/** Définit le challenge actif et l’ajoute au registre des définitions. */
export async function saveActiveChallengeToCloud(
  raw: ChallengeDefinition,
): Promise<{ ok: boolean; stored: boolean }> {
  const def = sanitizeChallengeDefinition(raw);
  if (!def) return { ok: false, stored: false };
  if (!createRedis()) {
    return { ok: false, stored: false };
  }
  try {
    const stored = await saveActiveChallengeToRedis(def);
    await upsertChallengeDefinitionInRedis(def);
    return { ok: true, stored };
  } catch {
    return { ok: false, stored: false };
  }
}

/** Registre des titres / règles par saison (pour l’historique). */
export async function fetchChallengeDefinitions(): Promise<{
  ok: boolean;
  definitions: ChallengeDefinitionsRegistry;
}> {
  if (!createRedis()) {
    return { ok: true, definitions: {} };
  }
  try {
    const definitions = (await loadChallengeDefinitionsFromRedis()) ?? {};
    return { ok: true, definitions };
  } catch {
    return { ok: false, definitions: {} };
  }
}
