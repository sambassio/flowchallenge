import confetti from "canvas-confetti";

const NEON = ["#22d3ee", "#e879f9", "#f472b6", "#a855f7", "#2dd4bf", "#fde047", "#ffffff"];

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function fire(partial: confetti.Options) {
  void confetti({
    ...partial,
    colors: NEON,
    disableForReducedMotion: true,
    zIndex: 9999,
  });
}

/** Explosion centrale + canons latéraux + pluie finale. */
export function triggerUltimateCompleteCelebration(): void {
  if (typeof window === "undefined" || reducedMotion()) return;

  const duration = 4200;
  const end = Date.now() + duration;

  fire({
    particleCount: 140,
    spread: 100,
    startVelocity: 48,
    gravity: 0.85,
    ticks: 320,
    scalar: 1.1,
    origin: { x: 0.5, y: 0.45 },
    shapes: ["circle", "square"],
  });

  window.setTimeout(() => {
    fire({
      particleCount: 90,
      angle: 60,
      spread: 72,
      startVelocity: 52,
      origin: { x: 0, y: 0.62 },
    });
    fire({
      particleCount: 90,
      angle: 120,
      spread: 72,
      startVelocity: 52,
      origin: { x: 1, y: 0.62 },
    });
  }, 180);

  const frame = () => {
    fire({
      particleCount: 4,
      angle: 90 + Math.random() * 40 - 20,
      spread: 55,
      startVelocity: 38,
      origin: {
        x: Math.random() * 0.35 + 0.1,
        y: Math.random() * 0.25,
      },
      scalar: 0.85,
    });
    fire({
      particleCount: 4,
      angle: 90 + Math.random() * 40 - 20,
      spread: 55,
      startVelocity: 38,
      origin: {
        x: Math.random() * 0.35 + 0.55,
        y: Math.random() * 0.25,
      },
      scalar: 0.85,
    });
    if (Date.now() < end) {
      window.requestAnimationFrame(frame);
    }
  };
  window.requestAnimationFrame(frame);

  window.setTimeout(() => {
    fire({
      particleCount: 200,
      spread: 160,
      startVelocity: 28,
      gravity: 0.6,
      ticks: 400,
      scalar: 0.9,
      origin: { x: 0.5, y: 0.35 },
    });
  }, 900);

  window.setTimeout(() => {
    fire({
      particleCount: 80,
      spread: 360,
      startVelocity: 14,
      gravity: 0.4,
      ticks: 500,
      scalar: 0.55,
      origin: { x: 0.5, y: 0 },
    });
  }, 1600);
}
