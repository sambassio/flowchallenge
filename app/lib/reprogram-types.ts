export type ReprogrammationEntry = {
  identity: string;
  gratitude: string;
  program: string;
  deepFocusGoal: string;
  avoid: string;
  pursue: string;
};

/** Au moins un champ avec du texte (hors espaces). */
export function reprogrammationHasContent(entry: ReprogrammationEntry): boolean {
  return Object.values(entry).some((value) => value.trim() !== "");
}

export function coerceReprogrammationEntry(raw: unknown): ReprogrammationEntry {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const s = (k: keyof ReprogrammationEntry): string =>
    typeof o[k] === "string" ? o[k] : "";
  return {
    identity: s("identity"),
    gratitude: s("gratitude"),
    program: s("program"),
    deepFocusGoal: s("deepFocusGoal"),
    avoid: s("avoid"),
    pursue: s("pursue"),
  };
}
