import {
  ChallengeDefinition,
  ChallengeDefinitionMeta,
  sanitizeChallengeDefinition,
} from "@/app/lib/challenge-calendar-days";
import { createRedis } from "@/app/lib/redis-client";

const ACTIVE_KEY = "challenge:active:v1";
const DEFINITIONS_KEY = "challenge:definitions:v1";
const TTL_SEC = 60 * 60 * 24 * 400;

/** Challenge actuellement en cours (`null` si aucun / erreur). */
export async function loadActiveChallengeFromRedis(): Promise<ChallengeDefinition | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(ACTIVE_KEY);
    if (raw == null) return null;
    const parsed = typeof raw === "string" ? safeParse(raw) : raw;
    return sanitizeChallengeDefinition(parsed);
  } catch {
    return null;
  }
}

export async function saveActiveChallengeToRedis(
  def: ChallengeDefinition,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  try {
    await redis.set(ACTIVE_KEY, def, { ex: TTL_SEC });
    return true;
  } catch {
    return false;
  }
}

export type ChallengeDefinitionsRegistry = Record<
  string,
  ChallengeDefinitionMeta
>;

function normalizeRegistry(raw: unknown): ChallengeDefinitionsRegistry {
  const parsed = typeof raw === "string" ? safeParse(raw) : raw;
  if (!parsed || typeof parsed !== "object") return {};
  const out: ChallengeDefinitionsRegistry = {};
  for (const [id, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const title = typeof v.title === "string" ? v.title.trim() : "";
    if (!title) continue;
    const rules = Array.isArray(v.rules)
      ? v.rules
          .filter((r): r is string => typeof r === "string")
          .map((r) => r.trim())
          .filter((r) => r.length > 0)
      : [];
    out[id] = { title, rules };
  }
  return out;
}

export async function loadChallengeDefinitionsFromRedis(): Promise<ChallengeDefinitionsRegistry | null> {
  const redis = createRedis();
  if (!redis) return null;
  try {
    const raw: unknown = await redis.get(DEFINITIONS_KEY);
    if (raw == null) return {};
    return normalizeRegistry(raw);
  } catch {
    return null;
  }
}

/** Enregistre (ou met à jour) la définition d’une saison dans le registre. */
export async function upsertChallengeDefinitionInRedis(
  def: ChallengeDefinition,
): Promise<boolean> {
  const redis = createRedis();
  if (!redis) return false;
  try {
    const current = (await loadChallengeDefinitionsFromRedis()) ?? {};
    const next: ChallengeDefinitionsRegistry = {
      ...current,
      [def.id]: { title: def.title, rules: def.rules },
    };
    await redis.set(DEFINITIONS_KEY, next, { ex: TTL_SEC });
    return true;
  } catch {
    return false;
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
