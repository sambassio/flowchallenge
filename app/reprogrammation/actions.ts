"use server";

import "server-only";

import type { ReprogrammationEntry } from "@/app/lib/reprogram-types";
import { coerceReprogrammationEntry } from "@/app/lib/reprogram-types";
import { getParisYYYYMMDD } from "@/app/lib/paris-time";
import { saveReprogramForParisDay } from "@/app/lib/reprogram-storage";

const MAX_FIELD = 3800;

function clamp(entry: ReprogrammationEntry): ReprogrammationEntry {
  const clip = (s: string) => s.slice(0, MAX_FIELD);
  return {
    identity: clip(entry.identity),
    gratitude: clip(entry.gratitude),
    program: clip(entry.program),
    deepFocusGoal: clip(entry.deepFocusGoal),
    avoid: clip(entry.avoid),
    pursue: clip(entry.pursue),
  };
}

/** Persiste le texte pour le jour calendaire Europe/Paris (rappels Telegram). */
export async function persistReprogrammationForTelegram(
  payload: unknown,
): Promise<{ ok: boolean; stored: boolean; message?: string }> {
  try {
    const entry = clamp(coerceReprogrammationEntry(payload));
    const parisDay = getParisYYYYMMDD();
    const stored = await saveReprogramForParisDay(parisDay, entry);

    return {
      ok: true,
      stored,
      message: stored
        ? undefined
        : "Redis non configuré : texte gardé uniquement localement.",
    };
  } catch (e) {
    console.error("[reprogram persist]", e);
    return {
      ok: false,
      stored: false,
      message:
        "Échec de la synchro cloud (voir logs). Le texte local est quand même enregistré.",
    };
  }
}
