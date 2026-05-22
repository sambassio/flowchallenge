import type { ReprogrammationEntry } from "@/app/lib/reprogram-types";

const LABELS: Array<[keyof ReprogrammationEntry, string]> = [
  ["identity", "Je suis quelqu'un qui :"],
  ["gratitude", "5 choses pour lesquels je suis reconnaissant :"],
  ["program", "Programme de la journée :"],
  ["deepFocusGoal", "Objectif du deep focus :"],
  ["avoid", "2–3 choses à éviter :"],
  ["pursue", "2–3 choses à poursuivre :"],
];

function escapeHtmlTelegramSafe(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatReprogramHtml(
  headerLine: string,
  entry: ReprogrammationEntry,
): string {
  const chunks: string[] = [];
  let block = `<b>${escapeHtmlTelegramSafe(headerLine)}</b>\n`;

  function flushBlock() {
    if (block.trim()) chunks.push(block.trimEnd());
  }

  function pushSection(title: string, body: string) {
    const t = `<b>${escapeHtmlTelegramSafe(title)}</b>`;
    const b = escapeHtmlTelegramSafe(body.trim() || "—").replace(/\n/g, "<br>");
    const piece = `\n\n${t}\n${b}`;

    if ((block + piece).length > 3700) {
      flushBlock();
      block = piece.trimStart();
    } else {
      block += piece;
    }
  }

  for (const [key, title] of LABELS) {
    pushSection(title, entry[key]);
  }

  flushBlock();
  return chunks.join("\n\n---\n\n") || `<b>${escapeHtmlTelegramSafe(headerLine)}</b>`;
}

const MAX_CHARS = 3800;

export function splitTelegramHtmlChunks(html: string): string[] {
  if (html.length <= MAX_CHARS) return [html];
  const chunks: string[] = [];
  const parts = html.split(/\n\n---\n\n/);
  let cur = "";

  function pushCur() {
    if (cur.trim()) chunks.push(cur.trim());
    cur = "";
  }

  for (const part of parts) {
    if ((cur + "\n\n" + part).trim().length > MAX_CHARS && cur.trim()) pushCur();

    const toAdd =
      cur.trim().length === 0 ? part : `${cur.trim()}\n\n---\n\n${part}`;
    cur = toAdd;

    while (cur.length > MAX_CHARS) {
      chunks.push(cur.slice(0, MAX_CHARS).trimEnd());
      cur = cur.slice(MAX_CHARS);
    }
  }
  pushCur();
  return chunks.length ? chunks : [html.slice(0, MAX_CHARS)];
}

export async function sendTelegramHtmlChunks(messages: string[]): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing");
    return;
  }

  for (let i = 0; i < messages.length; i++) {
    const text = `${messages[i]}`;
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    const bodyUnknown: unknown = await res.json();

    type TgResp = {
      ok?: boolean;
      description?: string;
    };
    const body = bodyUnknown as TgResp;
    if (!res.ok || !body.ok) {
      console.error("[telegram] sendMessage failed", res.status, bodyUnknown);
      throw new Error(body.description ?? `Telegram send failed (${res.status})`);
    }

    if (messages.length > 1 && i < messages.length - 1) {
      await new Promise((r) => setTimeout(r, 380));
    }
  }
}

export async function sendReprogramReminderToTelegram(
  parisYmd: string,
  triggerHourParis: number,
  entry: ReprogrammationEntry | null,
): Promise<void> {
  const slot = `${triggerHourParis}h Paris`;
  const header = `[Reprogrammation] · ${slot} · ${parisYmd}`;
  let html = "";
  if (entry && hasSomeContent(entry)) {
    html = formatReprogramHtml(header, entry);
  } else {
    html = `<b>${escapeHtmlTelegramSafe(header)}</b>\nPas encore renseigné ce jour là.`;
  }
  const chunks = splitTelegramHtmlChunks(html);
  await sendTelegramHtmlChunks(chunks);
}

export function hasSomeContent(entry: ReprogrammationEntry): boolean {
  return Object.values(entry).some((v) => typeof v === "string" && v.trim() !== "");
}
