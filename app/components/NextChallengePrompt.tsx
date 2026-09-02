"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_CHALLENGE_RULES,
  TOTAL_DAYS,
} from "@/app/lib/challenge-calendar-days";

function todayLabel(): string {
  return new Date()
    .toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, ".");
}

export function NextChallengePrompt({
  variant = "cleared",
  onStart,
  onClose,
}: {
  variant?: "cleared" | "failed";
  onStart: (title: string, rules: string[]) => void | Promise<void>;
  onClose: () => void;
}) {
  const failed = variant === "failed";
  const [title, setTitle] = useState("");
  const [rules, setRules] = useState<string[]>(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const cleanRules = rules.map((r) => r.trim()).filter((r) => r.length > 0);
  const canSubmit = title.trim().length > 0 && cleanRules.length > 0;

  const updateRule = (i: number, value: string) => {
    setRules((prev) => prev.map((r, idx) => (idx === i ? value : r)));
  };

  const addRule = () => {
    setRules((prev) =>
      prev.length >= MAX_CHALLENGE_RULES ? prev : [...prev, ""],
    );
  };

  const removeRule = (i: number) => {
    setRules((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onStart(title.trim(), cleanRules);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={
        failed
          ? "Challenge raté — démarrer un nouveau challenge"
          : "Démarrer un nouveau challenge"
      }
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <form
        onSubmit={handleSubmit}
        className={[
          "relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-zinc-950/90 p-5 backdrop-blur-md sm:p-7",
          failed
            ? "border border-rose-400/35 shadow-[0_0_70px_-14px_rgba(244,63,94,0.45)]"
            : "border border-cyan-400/30 shadow-[0_0_70px_-14px_rgba(34,211,238,0.5)]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-zinc-700/70 text-zinc-400 transition-colors hover:border-cyan-400/60 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>

        <p
          className={[
            "font-orbitron text-[9px] font-semibold uppercase tracking-[0.32em]",
            failed ? "text-rose-400/90" : "text-cyan-400/85",
          ].join(" ")}
        >
          {failed ? "challenge failed · next up" : "challenge cleared · next up"}
        </p>
        <h2
          className={[
            "font-orbitron mt-1 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl",
            failed
              ? "bg-linear-to-r from-rose-200 via-orange-200 to-amber-200"
              : "bg-linear-to-r from-cyan-200 via-fuchsia-200 to-pink-200",
          ].join(" ")}
        >
          Nouveau challenge
        </h2>
        <p className="mt-2 font-mono text-[11px] text-zinc-500 tabular-nums">
          départ aujourd’hui · {todayLabel()} · {TOTAL_DAYS} jours
        </p>
        {failed ? (
          <p className="mt-2 text-xs leading-snug text-rose-200/70">
            Pas d’étoile. Ce challenge est raté — tu repars de zéro.
          </p>
        ) : null}

        <div className="mt-6 space-y-2">
          <label
            htmlFor="next-challenge-title"
            className="font-orbitron text-[9px] font-semibold uppercase tracking-[0.28em] text-fuchsia-400/85"
          >
            titre
          </label>
          <input
            id="next-challenge-title"
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Challenge…"
            className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-3.5 py-2.5 font-orbitron text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-400/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
          />
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[9px] font-semibold uppercase tracking-[0.28em] text-fuchsia-400/85">
              règles
            </span>
            <button
              type="button"
              onClick={addRule}
              disabled={rules.length >= MAX_CHALLENGE_RULES}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/8 px-2.5 py-1 font-orbitron text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              + règle
            </button>
          </div>
          <ul className="space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="shrink-0 font-orbitron text-[9px] tabular-nums text-cyan-500/90"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(i, e.target.value)}
                  maxLength={140}
                  aria-label={`Règle ${i + 1}`}
                  placeholder="Décris la règle…"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-400/60 focus:outline-none focus:ring-1 focus:ring-fuchsia-400/30"
                />
                <button
                  type="button"
                  onClick={() => removeRule(i)}
                  disabled={rules.length <= 1}
                  aria-label={`Supprimer la règle ${i + 1}`}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-700/70 text-zinc-500 transition-colors hover:border-pink-500/50 hover:text-pink-300 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400"
                >
                  <span aria-hidden className="text-sm leading-none">
                    −
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700/70 px-4 py-2 font-orbitron text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            plus tard
          </button>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="rounded-full border border-cyan-400/40 bg-linear-to-r from-cyan-500/20 via-fuchsia-500/20 to-pink-500/20 px-5 py-2 font-orbitron text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100 transition-colors hover:border-cyan-300/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {submitting ? "démarrage…" : "démarrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
