import confetti from "canvas-confetti";

const NEON_COLORS = [
  "#22d3ee",
  "#e879f9",
  "#f472b6",
  "#a855f7",
  "#2dd4bf",
  "#fde047",
];

function resolveOrigin(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (clientX !== 0 || clientY !== 0) {
    return { x: clientX / w, y: clientY / h };
  }
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / w,
    y: (r.top + r.height / 2) / h,
  };
}

export function burstNeonConfetti(
  target: HTMLElement,
  clientX: number,
  clientY: number,
): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const origin = resolveOrigin(target, clientX, clientY);

  const shoot = (partial: confetti.Options) => {
    void confetti({
      ...partial,
      colors: NEON_COLORS,
      disableForReducedMotion: true,
    });
  };

  shoot({
    particleCount: 68,
    spread: 78,
    startVelocity: 34,
    gravity: 0.92,
    ticks: 240,
    scalar: 0.95,
    origin,
    shapes: ["circle", "square"],
  });

  shoot({
    particleCount: 48,
    spread: 130,
    startVelocity: 24,
    gravity: 1.02,
    ticks: 280,
    scalar: 0.72,
    origin,
    angle: 55,
  });

  window.setTimeout(() => {
    shoot({
      particleCount: 36,
      spread: 110,
      startVelocity: 16,
      gravity: 0.88,
      ticks: 220,
      scalar: 0.62,
      origin: { x: origin.x, y: origin.y - 0.02 },
    });
  }, 120);
}
