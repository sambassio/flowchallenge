/** Grille « challenge » alignée ChallengeCalendar.tsx (mai 2026 · 31 jours). */

export const TOTAL_DAYS = 31;

/** Ancre locale identique au calendrier (interprété en fuseau du runtime). */
export const CHALLENGE_START = new Date(2026, 4, 18);

export function formatChallengeDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildChallengeDates(): Date[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = new Date(CHALLENGE_START);
    d.setDate(CHALLENGE_START.getDate() + i);
    return d;
  });
}

export function getAllChallengeDayKeys(): string[] {
  return buildChallengeDates().map(formatChallengeDayKey);
}

/** Ancienne clé localStorage uniquement ; conservée pour migrations. */
export const CHALLENGE_LOCAL_STORAGE_KEY = "flowchallenge-2026-05-18";
