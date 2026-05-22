/** Fuseau IANA utilisé pour le jour-calendrier des rappels (Redis) et l’horloge 13h / 21h locales. */

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone?.trim()) return false;
  if (timeZone.length > 180) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timeZone.trim() }).format();
    return true;
  } catch {
    return false;
  }
}

export function calendarYYYYMMDDInTimeZone(now: Date, timeZone: string): string {
  return now.toLocaleDateString("en-CA", { timeZone: timeZone.trim() });
}

/** Heure & minute murales dans le fuseau (h23 pour couvrir 13 / 21). */
export function wallClockHourMinute(
  now: Date,
  timeZone: string,
): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone.trim(),
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  let hourStr = "";
  let minuteStr = "";
  for (const p of formatter.formatToParts(now)) {
    if (p.type === "hour") hourStr = p.value;
    else if (p.type === "minute") minuteStr = p.value;
  }
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}
