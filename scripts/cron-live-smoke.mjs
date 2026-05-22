#!/usr/bin/env node
/**
 * Appel prod authentifié (même que GitHub Actions).
 * Usage : CRON_SECRET=… npm run test:cron:live
 * Envoi Telegram immédiat (query ?immediate=1) :
 * IMMEDIATE=1 CRON_SECRET=… npm run test:cron:live (ou npm run test:cron:live:now)
 * Optionnel : CRON_URL=https://… (défaut = prod actuelle du projet).
 * Ne pas commiter de secret dans ce fichier.
 */

const cronSecret = process.env.CRON_SECRET;
const cronBaseUrl =
  process.env.CRON_URL ??
  "https://flowchallenge-alpha.vercel.app/api/cron/reprogram-telegram";

const immediate = process.env.IMMEDIATE === "1";
const cronUrl =
  immediate && cronBaseUrl.includes("?")
    ? `${cronBaseUrl}&immediate=1`
    : immediate
      ? `${cronBaseUrl}?immediate=1`
      : cronBaseUrl;

if (!cronSecret) {
  console.error(
    "CRON_SECRET manquant. Export depuis Vercel ou ton .env local (gitignored)."
  );
  process.exitCode = 2;
  process.exit();
}

const res = await fetch(cronUrl, {
  headers: { Authorization: `Bearer ${cronSecret}` },
});

const raw = await res.text();
/** @type {unknown} */
let body;
try {
  body = JSON.parse(raw);
} catch {
  body = raw;
}

console.log(`HTTP ${res.status}`);
console.dir(body, { depth: null });

/** @type {{ ok?: boolean }} */
const parsed = typeof body === "object" && body !== null ? body : {};
const okCronResponse =
  res.ok &&
  parsed !== null &&
  typeof parsed === "object" &&
  "ok" in parsed &&
  parsed.ok === true;

if (!okCronResponse) {
  process.exitCode = 1;
}
