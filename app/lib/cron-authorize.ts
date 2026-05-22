/** Bearer check pour `/api/cron/*` ; secret jamais en dur dans le repo. */
export function authorizeCron(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] CRON_SECRET non défini — refusé en prod");
    return process.env.NODE_ENV !== "production";
  }
  return authHeader === `Bearer ${secret}`;
}
