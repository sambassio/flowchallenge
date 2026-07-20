/** Grille challenge · saison courante (31 jours à partir du 20 juillet 2026). */

export const TOTAL_DAYS = 31;

/** Identifiant de saison (clés Redis / localStorage). */
export const CHALLENGE_SEASON_ID = "2026-07-20";

/** Première case = 20 juillet 2026. */
export const CHALLENGE_START = new Date(2026, 6, 20);

export const CHALLENGE_LOCAL_STORAGE_KEY = `flowchallenge-${CHALLENGE_SEASON_ID}`;

export const CHALLENGE_COMPLETIONS_LOCAL_KEY = "flowchallenge-completions-v1";

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
