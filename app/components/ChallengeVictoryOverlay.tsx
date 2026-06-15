"use client";

type VictoryMode = "epic" | "ambient";

export function ChallengeVictoryOverlay({ mode }: { mode: VictoryMode }) {
  const epic = mode === "epic";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden={mode === "ambient"}
      role={epic ? "status" : undefined}
      aria-live={epic ? "polite" : undefined}
      aria-label={epic ? "Challenge terminé — tous les jours complétés" : undefined}
    >
      <div
        className={[
          "absolute inset-0",
          epic ? "animate-victory-flash" : "bg-cyan-500/[0.03]",
        ].join(" ")}
      />

      <div className="absolute left-1/2 top-1/2 size-[min(140vw,140vh)] -translate-x-1/2 -translate-y-1/2">
        <div
          className={[
            "absolute inset-0 rounded-full border-2 border-cyan-400/40",
            epic ? "animate-victory-shockwave" : "animate-victory-shockwave-slow opacity-40",
          ].join(" ")}
        />
        <div
          className={[
            "absolute inset-[12%] rounded-full border border-fuchsia-400/35",
            epic ? "animate-victory-shockwave-delay" : "opacity-25",
          ].join(" ")}
        />
      </div>

      <div
        className={[
          "absolute inset-0 opacity-60",
          epic ? "animate-victory-aurora" : "animate-victory-aurora-slow",
        ].join(" ")}
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(34,211,238,0.35), transparent 70%), radial-gradient(ellipse 40% 35% at 20% 60%, rgba(217,70,239,0.28), transparent), radial-gradient(ellipse 40% 35% at 80% 55%, rgba(236,72,153,0.22), transparent)",
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <p
          className={[
            "font-orbitron text-[10px] font-semibold uppercase tracking-[0.55em] text-cyan-300/90",
            epic ? "animate-victory-subtitle" : "opacity-70",
          ].join(" ")}
        >
          deep focus unlocked
        </p>
        <h2
          className={[
            "font-orbitron mt-3 max-w-4xl text-center text-3xl font-black uppercase tracking-[0.12em] sm:text-5xl md:text-6xl",
            "bg-linear-to-r from-cyan-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent",
            epic ? "animate-victory-title" : "animate-victory-title-ambient",
          ].join(" ")}
        >
          challenge cleared
        </h2>
        <p
          className={[
            "mt-4 font-mono text-xs tabular-nums text-zinc-400 sm:text-sm",
            epic ? "animate-victory-subtitle" : "opacity-60",
          ].join(" ")}
          style={epic ? { animationDelay: "0.15s" } : undefined}
        >
          31 / 31 · no scroll · reprogrammation
        </p>
        {epic ? (
          <div className="mt-8 flex gap-2">
            {["cyan", "fuchsia", "pink"].map((hue, i) => (
              <span
                key={hue}
                className={[
                  "size-2 rounded-full",
                  hue === "cyan"
                    ? "bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]"
                    : hue === "fuchsia"
                      ? "bg-fuchsia-400 shadow-[0_0_12px_2px_rgba(217,70,239,0.8)]"
                      : "bg-pink-400 shadow-[0_0_12px_2px_rgba(236,72,153,0.8)]",
                  "animate-victory-dot",
                ].join(" ")}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {epic ? (
        <div className="absolute inset-0 animate-victory-scanlines opacity-[0.07]" aria-hidden />
      ) : null}
    </div>
  );
}
