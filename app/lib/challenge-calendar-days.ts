/** Grille challenge · saison courante (31 jours à partir du 31 juillet 2026). */

export const TOTAL_DAYS = 31;

/** Identifiant de saison (clés Redis / localStorage). */
export const CHALLENGE_SEASON_ID = "2026-07-31";

/** Première case = 31 juillet 2026. */
export const CHALLENGE_START = new Date(2026, 6, 31);

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
