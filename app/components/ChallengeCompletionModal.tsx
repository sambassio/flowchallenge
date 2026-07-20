"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  completedSeasonsMeta,
  TOTAL_DAYS,
} from "@/app/lib/challenge-calendar-days";

const CHALLENGE_TITLE = "Challenge Deepfocus & No Scroll";

const RULES = [
  "1 deep focus d’1 h tous les jours, sauf le samedi.",
  "Pas de scroll avant 18 h.",
  "Reprogrammation tous les matins avec le café.",
];

export function ChallengeCompletionModal({
  seasons,
  activeSeasonId,
  onClose,
}: {
  seasons: string[];
  activeSeasonId: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const metas = completedSeasonsMeta(seasons);
  const meta = metas.find((m) => m.id === activeSeasonId) ?? null;

  useEffect(() => {
    closeRef.current?.focus();
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

  const heading = meta
    ? `Saison ${meta.index} · ${meta.monthLabel}`
    : "Challenge gagné";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Challenge gagné — ${heading}`}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-400/30 bg-zinc-950/90 p-5 shadow-[0_0_60px_-12px_rgba(16,185,129,0.45)] backdrop-blur-md sm:p-7">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full border border-zinc-700/70 text-zinc-400 transition-colors hover:border-emerald-400/60 hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>

        <div className="flex items-center gap-3 pr-8">
          <Image
            src="/completion-star-green.png"
            alt=""
            aria-hidden
            width={192}
            height={190}
            className="h-11 w-auto drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]"
          />
          <div>
            <p className="font-orbitron text-[9px] font-semibold uppercase tracking-[0.3em] text-emerald-400/80">
              challenge gagné
            </p>
            <h2 className="font-orbitron bg-linear-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent sm:text-xl">
              {CHALLENGE_TITLE}
            </h2>
          </div>
        </div>

        {meta ? (
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-orbitron text-sm font-semibold text-emerald-100">
                {heading}
                {meta.isCurrent ? (
                  <span className="ml-2 rounded-full border border-cyan-400/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-200/90">
                    en cours
                  </span>
                ) : null}
              </p>
              <p className="font-orbitron text-xs font-bold tabular-nums text-emerald-300">
                {TOTAL_DAYS}/{TOTAL_DAYS}
              </p>
            </div>
            <p className="mt-1 font-mono text-[11px] text-zinc-400 tabular-nums">
              {meta.startLabel} → {meta.endLabel} · {TOTAL_DAYS} jours complétés
            </p>

            <p className="mt-4 font-orbitron text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-400/80">
              règles tenues
            </p>
            <ul className="mt-2 space-y-1.5">
              {RULES.map((rule, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-xs leading-snug text-zinc-300"
                >
                  <span aria-hidden className="mt-0.5 text-emerald-400/90">
                    ✓
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 text-center font-mono text-xs text-zinc-500">
            Détails du challenge introuvables.
          </p>
        )}
      </div>
    </div>
  );
}
