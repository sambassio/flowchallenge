/** Date calendaire locale Europe/Paris (YYYY-MM-DD), aligné fuseau utilisé par le cron Telegram. */
export function getParisYYYYMMDD(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/** Heure & minute murales Paris (pour déclenchements 14h / 18h). */
export function getParisHourMinute(now: Date = new Date()): {
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
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
