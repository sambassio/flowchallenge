export type ReprogrammationEntry = {
  identity: string;
  gratitude: string;
  program: string;
  deepFocusGoal: string;
  avoid: string;
  pursue: string;
};

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
