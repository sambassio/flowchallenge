"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchChallengeChecksFromCloud,
  persistChallengeChecksToCloud,
} from "@/app/challenge-calendar/actions";
import {
  buildChallengeDates,
  CHALLENGE_LOCAL_STORAGE_KEY,
  formatChallengeDayKey,
  getAllChallengeDayKeys,
  TOTAL_DAYS,
} from "@/app/lib/challenge-calendar-days";
import { burstNeonConfetti } from "@/app/lib/neonConfetti";

type CalendarSlot = { kind: "empty" } | { kind: "day"; date: Date };

function buildWeekGrid(days: Date[]): CalendarSlot[] {
  if (days.length === 0) return [];
  const lead = days[0].getDay();
  const trailing = (7 - ((lead + days.length) % 7)) % 7;
  const out: CalendarSlot[] = [];
  for (let i = 0; i < lead; i++) out.push({ kind: "empty" });
  for (const d of days) out.push({ kind: "day", date: d });
  for (let i = 0; i < trailing; i++) out.push({ kind: "empty" });
  return out;
}

function loadCheckedLocal(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(CHALLENGE_LOCAL_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveCheckedLocal(next: Set<string>) {
  window.localStorage.setItem(
    CHALLENGE_LOCAL_STORAGE_KEY,
    JSON.stringify([...next]),
  );
}

function streakFromStart(keys: Set<string>, dayKeys: string[]): number {
  let n = 0;
  for (const k of dayKeys) {
    if (keys.has(k)) n += 1;
    else break;
  }
  return n;
}

/** Dimanche → samedi (aligné avec getDay() : 0 = dimanche) */
const WEEKDAY_LETTERS = ["d", "l", "m", "m", "j", "v", "s"] as const;

const badgeGlow = {
  cyan: "border-cyan-500/35 bg-cyan-500/[0.08] shadow-[0_0_28px_-8px_rgba(34,211,238,0.45)]",
  fuchsia:
    "border-fuchsia-500/35 bg-fuchsia-500/8 shadow-[0_0_28px_-8px_rgba(217,70,239,0.4)]",
  pink: "border-pink-500/35 bg-pink-500/[0.08] shadow-[0_0_28px_-8px_rgba(236,72,153,0.35)]",
  amber:
    "border-amber-400/35 bg-amber-400/[0.07] shadow-[0_0_28px_-8px_rgba(251,191,36,0.35)]",
} as const;

type BadgeHue = keyof typeof badgeGlow;

function StatBadge({
  hue,
  tag,
  value,
  foot,
}: {
  hue: BadgeHue;
  tag: string;
  value: string;
  foot?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-sm",
        badgeGlow[hue],
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full opacity-30 blur-2xl"
        style={{
          background:
            hue === "cyan"
              ? "rgb(34 211 238)"
              : hue === "fuchsia"
                ? "rgb(217 70 239)"
                : hue === "pink"
                  ? "rgb(236 72 153)"
                  : "rgb(251 191 36)",
        }}
        aria-hidden
      />
      <p className="font-orbitron text-[9px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {tag}
      </p>
      <p className="font-orbitron text-2xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-3xl">
        {value}
      </p>
      {foot ? (
        <p className="mt-0.5 font-mono text-[10px] tracking-wide text-zinc-500">{foot}</p>
      ) : null}
    </div>
  );
}

export function ChallengeCalendar() {
  const days = useMemo(() => buildChallengeDates(), []);
  const dayKeys = useMemo(() => getAllChallengeDayKeys(), []);
  const weekGrid = useMemo(() => buildWeekGrid(days), [days]);

  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [mounted, setMounted] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudSyncEnabledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const local = loadCheckedLocal();
      const { keys: remote, ok, cloudConfigured } =
        await fetchChallengeChecksFromCloud();

      if (cancelled) return;

      cloudSyncEnabledRef.current = cloudConfigured;

      const allowed = new Set(dayKeys);
      const merged = new Set<string>();
      for (const k of local) {
        if (allowed.has(k)) merged.add(k);
      }
      if (ok) {
        for (const k of remote) {
          if (allowed.has(k)) merged.add(k);
        }
      }

      setChecked(merged);
      saveCheckedLocal(merged);

      if (cloudConfigured && ok) {
        await persistChallengeChecksToCloud([...merged]);
      }

      setMounted(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dayKeys]);

  const scheduleCloudPersist = useCallback((next: Set<string>) => {
    if (!cloudSyncEnabledRef.current) return;
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void persistChallengeChecksToCloud([...next]);
    }, 550);
  }, []);

  const toggle = useCallback(
    (key: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        saveCheckedLocal(next);
        scheduleCloudPersist(next);
        return next;
      });
    },
    [scheduleCloudPersist],
  );

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  const doneCount = checked.size;
  const percent = Math.round((doneCount / TOTAL_DAYS) * 100);
  const streak = streakFromStart(checked, dayKeys);
  const displayLevel =
    percent === 0 ? 0 : Math.min(10, Math.ceil(percent / 10));

  return (
    <div className="relative isolate min-h-full overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="animate-grid-pan pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 211, 238, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,85,247,0.22),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(34,211,238,0.12),transparent),radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(236,72,153,0.1),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-cyan-500/15 pb-5">
          <div>
            <h1 className="font-orbitron max-w-xl bg-linear-to-r from-cyan-200 via-fuchsia-200 to-pink-200 bg-clip-text text-balance text-xl font-bold leading-tight tracking-tight text-transparent sm:text-2xl md:text-3xl">
              Challenge Deepfocus &amp; No Scroll
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-500 tabular-nums">
              <time dateTime={dayKeys[0]}>{days[0].toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".")}</time>
              {" → "}
              <time dateTime={dayKeys[TOTAL_DAYS - 1]}>
                {days[TOTAL_DAYS - 1].toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".")}
              </time>
              <span className="text-zinc-600"> · {TOTAL_DAYS}d</span>
              <span className="block text-[10px] text-zinc-600">
                ta progression suit sur tous tes appareils (nuage Redis)
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/reprogrammation"
              className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/8 px-3 py-1.5 font-orbitron text-[10px] font-semibold uppercase tracking-[0.28em] text-fuchsia-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              reprogrammation
            </Link>
            <span className="font-orbitron text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-400/75">
              online
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
            <div className="grid grid-cols-7 gap-2 sm:gap-3" aria-hidden>
              {WEEKDAY_LETTERS.map((letter, i) => (
                <div
                  key={`w-${letter}-${i}`}
                  className="select-none pb-0.5 text-center font-orbitron text-[10px] font-semibold tabular-nums tracking-wide text-zinc-500 sm:text-[11px]"
                >
                  {letter}
                </div>
              ))}
            </div>
            <ul
              className="grid grid-cols-7 gap-2 sm:gap-3"
              aria-label="Jours du challenge"
            >
              {weekGrid.map((slot, i) => {
                if (slot.kind === "empty") {
                  return (
                    <li
                      key={`pad-${i}`}
                      aria-hidden
                      className="relative min-h-16 sm:min-h-20"
                    />
                  );
                }

                const d = slot.date;
                const key = formatChallengeDayKey(d);
                const isOn = checked.has(key);
                const weekday = d.toLocaleDateString("fr-FR", {
                  weekday: "long",
                });
                const monthLong = d.toLocaleDateString("fr-FR", {
                  month: "long",
                });
                const dayNum = d.getDate();

                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={(e) => {
                        const wasOn = checked.has(key);
                        toggle(key);
                        if (!wasOn) {
                          burstNeonConfetti(
                            e.currentTarget,
                            e.clientX,
                            e.clientY,
                          );
                        }
                      }}
                      aria-pressed={isOn}
                      aria-label={`${weekday} ${dayNum} ${monthLong}${isOn ? ", complété" : ", à compléter"}`}
                      className={[
                        "flex aspect-square w-full min-h-16 max-h-28 items-center justify-center rounded-xl border transition-[box-shadow,border-color,background-color,color] motion-safe:duration-200 sm:max-h-none sm:min-h-20 sm:aspect-auto sm:rounded-2xl sm:py-6",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400",
                        isOn
                          ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100 shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)] motion-safe:active:translate-y-px"
                          : "border-zinc-700/80 bg-zinc-950/35 text-zinc-100 hover:border-fuchsia-500/45 hover:bg-zinc-900/55 motion-safe:active:translate-y-px",
                      ].join(" ")}
                    >
                      <span className="font-orbitron text-xl tabular-nums tracking-tight sm:text-2xl md:text-3xl">
                        {dayNum}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <aside
            aria-label="Stats du challenge"
            className="w-full shrink-0 lg:w-56 lg:self-stretch xl:w-64 2xl:w-72"
          >
            <div className="lg:sticky lg:top-6">
              <p className="mb-3 font-orbitron text-[9px] uppercase tracking-[0.35em] text-zinc-600">
                loadout
              </p>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-1">
                <div
                  className={[
                    "relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-sm lg:col-span-1 lg:flex-col lg:gap-3 lg:py-5",
                    badgeGlow.cyan,
                  ].join(" ")}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Niveau ${mounted ? displayLevel : "…"}, progression ${mounted ? percent : 0}%`}
                >
                  <div className="relative grid size-14 shrink-0 place-items-center xl:size-16">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-zinc-800/90"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-pink-400 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300"
                        strokeWidth="3"
                        strokeDasharray="87.96"
                        strokeDashoffset={
                          87.96 - (87.96 * (mounted ? percent : 0)) / 100
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="pointer-events-none absolute flex flex-col items-center leading-none">
                      <span className="font-orbitron text-[8px] text-pink-300/90">
                        Lv
                      </span>
                      <span className="font-orbitron text-base font-bold tabular-nums text-pink-100">
                        {mounted ? displayLevel : "?"}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5 xl:w-full">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-orbitron text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                        xp
                      </p>
                      <span className="font-mono text-[11px] tabular-nums text-cyan-300/90">
                        {mounted ? `${percent}%` : "…"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-900/95 ring-1 ring-pink-500/25">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-cyan-500 via-fuchsia-500 to-pink-500 motion-safe:transition-[width] motion-safe:duration-300"
                        style={{
                          width: `${mounted ? percent : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <StatBadge
                  hue="amber"
                  tag="clear"
                  value={
                    mounted
                      ? `${String(doneCount).padStart(2, "0")}/${TOTAL_DAYS}`
                      : "··/31"
                  }
                />

                <StatBadge
                  hue="fuchsia"
                  tag="combo"
                  value={mounted ? `×${streak}` : "×·"}
                  foot={mounted && streak >= 7 ? "heat" : undefined}
                />
              </div>

              <section
                aria-label="Règles du challenge"
                className="mt-5 rounded-2xl border border-zinc-700/50 bg-zinc-950/55 p-4 backdrop-blur-sm"
              >
                <p className="font-orbitron text-[9px] font-semibold uppercase tracking-[0.32em] text-fuchsia-400/85">
                  règles
                </p>
                <ul className="mt-3 space-y-3 text-xs leading-snug text-zinc-400">
                  <li className="flex gap-2">
                    <span className="mt-1.5 shrink-0 font-orbitron text-[9px] text-cyan-500/90">
                      01
                    </span>
                    <span>
                      <span className="font-semibold text-zinc-200">
                        1 deep focus d’1&nbsp;h
                      </span>{" "}
                      <span className="text-zinc-300">tous les jours</span>,
                      sauf le{" "}
                      <span className="font-medium text-fuchsia-300/90">
                        samedi
                      </span>
                      .
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 shrink-0 font-orbitron text-[9px] text-cyan-500/90">
                      02
                    </span>
                    <span>
                      <span className="font-semibold text-zinc-200">
                        Pas de scroll
                      </span>{" "}
                      avant{" "}
                      <span className="tabular-nums text-cyan-200/95">
                        18&nbsp;h
                      </span>
                      .
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 shrink-0 font-orbitron text-[9px] text-cyan-500/90">
                      03
                    </span>
                    <span>
                      <span className="font-semibold text-zinc-200">
                        Faire la reprogrammation
                      </span>{" "}
                      <span className="text-zinc-300">
                        tous les matins avec mon café.
                      </span>
                    </span>
                  </li>
                </ul>
              </section>

              {!mounted ? (
                <p className="mt-3 text-center font-mono text-[10px] text-zinc-600">
                  …
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
