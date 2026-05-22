"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getParisYYYYMMDD } from "@/app/lib/paris-time";
import {
  coerceReprogrammationEntry,
  type ReprogrammationEntry,
} from "@/app/lib/reprogram-types";
import { persistReprogrammationForTelegram } from "@/app/reprogrammation/actions";

const EMPTY_ENTRY: ReprogrammationEntry = {
  identity: "",
  gratitude: "",
  program: "",
  deepFocusGoal: "",
  avoid: "",
  pursue: "",
};

const FIELDS: Array<{
  key: keyof ReprogrammationEntry;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "identity",
    label: "Je suis quelqu'un qui :",
    placeholder: "Ex : tient ses promesses, avance même quand c'est dur...",
    rows: 3,
  },
  {
    key: "gratitude",
    label: "5 choses pour lesquels je suis reconnaissant :",
    placeholder: "1. ...\n2. ...\n3. ...\n4. ...\n5. ...",
    rows: 6,
  },
  {
    key: "program",
    label: "Programme de la journée :",
    placeholder: "Les blocs importants de ta journée...",
    rows: 5,
  },
  {
    key: "deepFocusGoal",
    label: "Objectif du deep focus :",
    placeholder: "Le résultat concret à produire pendant le bloc.",
    rows: 3,
  },
  {
    key: "avoid",
    label: "2-3 choses à éviter :",
    placeholder: "1. ...\n2. ...\n3. ...",
    rows: 4,
  },
  {
    key: "pursue",
    label: "2-3 choses à poursuivre :",
    placeholder: "1. ...\n2. ...\n3. ...",
    rows: 4,
  },
];

function storageKeyParisToday(): string {
  return `flowchallenge-reprogrammation-${getParisYYYYMMDD(new Date())}`;
}

function labelParisToday(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function loadEntry(key: string): ReprogrammationEntry | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return coerceReprogrammationEntry(parsed);
  } catch {
    return null;
  }
}

export function ReprogrammationForm() {
  const [entry, setEntry] = useState<ReprogrammationEntry>(EMPTY_ENTRY);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const storageKey = useMemo(() => storageKeyParisToday(), []);
  const dateLabel = useMemo(() => labelParisToday(), []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const savedEntry = loadEntry(storageKey);
      if (savedEntry) {
        setEntry(savedEntry);
        setSaved(true);
      }
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, [storageKey]);

  function updateField(key: keyof ReprogrammationEntry, value: string) {
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(storageKey, JSON.stringify(entry));
    setSaved(true);

    void (async () => {
      setSyncNote(null);
      const cloud = await persistReprogrammationForTelegram(entry);
      if (cloud.message) {
        setSyncNote(cloud.message);
      } else if (cloud.ok && cloud.stored) {
        setSyncNote(null);
      } else if (!cloud.ok) {
        setSyncNote(cloud.message ?? "Erreur inconnue côté serveur.");
      }
    })();
  }

  const hasContent = Object.values(entry).some((value) => value.trim() !== "");

  return (
    <main className="relative isolate min-h-full overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_20%_0%,rgba(34,211,238,0.14),transparent),radial-gradient(ellipse_60%_50%_at_100%_25%,rgba(217,70,239,0.14),transparent),radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(236,72,153,0.1),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-fuchsia-500/15 pb-5">
          <div>
            <p className="font-orbitron text-[10px] font-semibold uppercase tracking-[0.38em] text-cyan-400/75">
              daily reset
            </p>
            <h1 className="font-orbitron mt-2 bg-linear-to-r from-cyan-200 via-fuchsia-200 to-pink-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Reprogrammation
            </h1>
            <p className="mt-1 text-sm capitalize text-zinc-500">{dateLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-cyan-400/35 bg-cyan-500/8 px-3 py-1.5 font-orbitron text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100 transition-colors hover:border-fuchsia-400/50 hover:text-fuchsia-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              accueil
            </Link>
            <div className="rounded-full border border-cyan-500/30 bg-cyan-500/8 px-3 py-1 font-orbitron text-[10px] uppercase tracking-[0.28em] text-cyan-200">
              {saved ? "locked" : "input"}
            </div>
          </div>
        </header>

        {!mounted ? (
          <p className="font-mono text-xs text-zinc-600">Chargement...</p>
        ) : saved ? (
          <section className="rounded-3xl border border-cyan-500/25 bg-zinc-950/60 p-4 shadow-[0_0_40px_-14px_rgba(34,211,238,0.5)] backdrop-blur-sm sm:p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {FIELDS.map((field) => (
                <article
                  key={field.key}
                  className="rounded-2xl border border-zinc-700/60 bg-zinc-950/55 p-4"
                >
                  <h2 className="font-orbitron text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300/85">
                    {field.label}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                    {entry[field.key].trim() || "—"}
                  </p>
                </article>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="mt-5 rounded-full border border-zinc-700 px-4 py-2 font-orbitron text-[10px] uppercase tracking-[0.25em] text-zinc-400 transition-colors hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              modifier
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-fuchsia-500/20 bg-zinc-950/55 p-4 shadow-[0_0_44px_-16px_rgba(217,70,239,0.5)] backdrop-blur-sm sm:p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {FIELDS.map((field) => (
                <label key={field.key} className="group grid gap-2">
                  <span className="font-orbitron text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 group-focus-within:text-cyan-300">
                    {field.label}
                  </span>
                  <textarea
                    value={entry[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    className="resize-y rounded-2xl border border-zinc-700/80 bg-black/30 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="font-mono text-[11px] text-zinc-600">
                Reset auto demain selon{" "}
                <span className="text-zinc-500">minuit Paris</span> · rappels
                Telegram&nbsp;: 14&nbsp;h&nbsp;&amp; 18&nbsp;h (Paris).
              </p>
              <button
                type="submit"
                disabled={!hasContent}
                className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-5 py-2.5 font-orbitron text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100 shadow-[0_0_24px_-8px_rgba(34,211,238,0.7)] transition disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900/50 disabled:text-zinc-700 disabled:shadow-none hover:bg-cyan-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                enregistrer
              </button>
            </div>
            {syncNote ? (
              <p className="mt-2 font-mono text-[11px] text-amber-400/95">
                {syncNote}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </main>
  );
}
