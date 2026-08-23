/** Grille challenge · saison courante (31 jours à partir du 20 juillet 2026). */

export const TOTAL_DAYS = 31;

/** Identifiant de saison (clés Redis / localStorage). */
export const CHALLENGE_SEASON_ID = "2026-07-20";

/** Première case = 20 juillet 2026. */
export const CHALLENGE_START = new Date(2026, 6, 20);

export const CHALLENGE_LOCAL_STORAGE_KEY = `flowchallenge-${CHALLENGE_SEASON_ID}`;

export const CHALLENGE_COMPLETIONS_LOCAL_KEY = "flowchallenge-completions-v1";

/** Challenge actif (titre + règles + date de départ) — sync navigateur. */
export const CHALLENGE_ACTIVE_LOCAL_KEY = "flowchallenge-active-v1";

/** Registre des définitions par saison (titre + règles), pour l’historique. */
export const CHALLENGE_DEFINITIONS_LOCAL_KEY = "flowchallenge-definitions-v1";

/** Clé localStorage des journées cochées pour une saison donnée. */
export function challengeChecksLocalKey(seasonId: string): string {
  return `flowchallenge-${seasonId}`;
}

/** Titre par défaut (saison July 2026 historique). */
export const DEFAULT_CHALLENGE_TITLE = "Challenge Deepfocus & No Scroll";

/** Règles par défaut (saison July 2026 historique). */
export const DEFAULT_CHALLENGE_RULES: string[] = [
  "1 deep focus d’1 h tous les jours, sauf le samedi.",
  "Pas de scroll avant 18 h.",
  "Reprogrammation tous les matins avec le café.",
];

/** Définition d’un challenge : identifiée par sa date de départ (= id). */
export type ChallengeDefinition = {
  /** Identifiant = date de départ au format YYYY-MM-DD. */
  id: string;
  title: string;
  rules: string[];
  /** ISO timestamp de création (facultatif). */
  createdAt?: string;
};

/** Métadonnées (titre + règles) par saison. */
export type ChallengeDefinitionMeta = {
  title: string;
  rules: string[];
};

export const DEFAULT_CHALLENGE: ChallengeDefinition = {
  id: CHALLENGE_SEASON_ID,
  title: DEFAULT_CHALLENGE_TITLE,
  rules: DEFAULT_CHALLENGE_RULES,
};

export const MAX_CHALLENGE_RULES = 8;

/** Valide / nettoie une définition brute (localStorage ou Redis). */
export function sanitizeChallengeDefinition(
  raw: unknown,
): ChallengeDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id) || !parseSeasonStart(id)) return null;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) return null;
  const rulesRaw = Array.isArray(o.rules) ? o.rules : [];
  const rules = rulesRaw
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
    .slice(0, MAX_CHALLENGE_RULES);
  const createdAt =
    typeof o.createdAt === "string" ? o.createdAt : undefined;
  return { id, title, rules, createdAt };
}

/** Saison mai 2026 (migration badge si 31/31). */
export const LEGACY_CHALLENGE_SEASON_ID = "2026-05-18";
export const LEGACY_CHALLENGE_START = new Date(2026, 4, 18);
export const LEGACY_CHALLENGE_LOCAL_STORAGE_KEY = "flowchallenge-2026-05-18";
export const LEGACY_CHALLENGE_REDIS_CHECKS_KEY = "challenge:checked-days:v1";

export function formatChallengeDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildChallengeDatesFromStart(start: Date): Date[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function buildChallengeDates(): Date[] {
  return buildChallengeDatesFromStart(CHALLENGE_START);
}

export function getAllChallengeDayKeys(): string[] {
  return buildChallengeDates().map(formatChallengeDayKey);
}

/** Dates d’une saison à partir de son id (date de départ YYYY-MM-DD). */
export function datesFromStartKey(startKey: string): Date[] {
  const start = parseSeasonStart(startKey);
  if (!start) return [];
  return buildChallengeDatesFromStart(start);
}

/** Journées (clés) d’une saison à partir de son id. */
export function dayKeysFromStartKey(startKey: string): string[] {
  return datesFromStartKey(startKey).map(formatChallengeDayKey);
}

/** Clé du jour courant (date locale) au format YYYY-MM-DD. */
export function todayChallengeKey(): string {
  return formatChallengeDayKey(new Date());
}

export function getLegacyChallengeDayKeys(): string[] {
  return buildChallengeDatesFromStart(LEGACY_CHALLENGE_START).map(
    formatChallengeDayKey,
  );
}

export function challengeChecksRedisKey(seasonId: string = CHALLENGE_SEASON_ID): string {
  return `challenge:checked-days:${seasonId}`;
}

export type ChallengeSeasonMeta = {
  id: string;
  index: number;
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  monthLabel: string;
  isCurrent: boolean;
};

function parseSeasonStart(id: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(id);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

function formatDayLabel(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");
}

/** Métadonnées d’une saison à partir de son identifiant (date de départ). */
export function seasonMetaFromId(id: string): ChallengeSeasonMeta | null {
  const start = parseSeasonStart(id);
  if (!start) return null;
  const dates = buildChallengeDatesFromStart(start);
  const end = dates[dates.length - 1];
  const monthLabel = start
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
  return {
    id,
    index: 0,
    start,
    end,
    startLabel: formatDayLabel(start),
    endLabel: formatDayLabel(end),
    monthLabel,
    isCurrent: id === CHALLENGE_SEASON_ID,
  };
}

/** Liste triée (plus récent en premier) des saisons gagnées. */
export function completedSeasonsMeta(seasonIds: string[]): ChallengeSeasonMeta[] {
  const metas = seasonIds
    .map(seasonMetaFromId)
    .filter((m): m is ChallengeSeasonMeta => m !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return metas
    .map((m, i) => ({ ...m, index: i + 1 }))
    .reverse();
}
