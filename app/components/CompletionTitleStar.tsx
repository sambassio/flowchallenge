"use client";

import { useId } from "react";

const CX = 50;
const CY = 50;
const R = 44;

function starTips(): [number, number][] {
  return Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
  });
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function facetPoints(i: number, tips: [number, number][]): string {
  const tip = tips[i];
  const nextMid = midpoint(tip, tips[(i + 1) % 5]);
  const prevMid = midpoint(tips[(i + 4) % 5], tip);
  const light = `${CX},${CY} ${tip[0]},${tip[1]} ${nextMid[0]},${nextMid[1]}`;
  const dark = `${CX},${CY} ${prevMid[0]},${prevMid[1]} ${tip[0]},${tip[1]}`;
  return `${light}|${dark}`;
}

/** Étoile facettée 3D (style badge) — version verte du site. */
export function CompletionTitleStar({ count }: { count: number }) {
  const uid = useId().replace(/:/g, "");
  if (count <= 0) return null;

  const label =
    count > 1
      ? `Challenge terminé ${count} fois`
      : "Challenge terminé";

  const tips = starTips();
  const facets = tips.map((_, i) => facetPoints(i, tips));

  return (
    <span
      className="inline-flex shrink-0 items-center self-center"
      title={label}
      aria-label={label}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="size-[1.45rem] sm:size-[1.75rem] md:size-[2.15rem]"
      >
        <defs>
          <linearGradient
            id={`${uid}-hi`}
            x1="20%"
            y1="0%"
            x2="80%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="35%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient
            id={`${uid}-lo`}
            x1="80%"
            y1="0%"
            x2="20%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#059669" />
            <stop offset="55%" stopColor="#047857" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <filter
            id={`${uid}-shadow`}
            x="-20%"
            y="-10%"
            width="140%"
            height="150%"
          >
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="2.5"
              floodColor="#022c22"
              floodOpacity="0.45"
            />
          </filter>
        </defs>
        <g filter={`url(#${uid}-shadow)`}>
          {facets.map((pair, i) => {
            const [light, dark] = pair.split("|");
            return (
              <g key={i}>
                <polygon points={light} fill={`url(#${uid}-hi)`} />
                <polygon points={dark} fill={`url(#${uid}-lo)`} />
              </g>
            );
          })}
          {tips.map((tip, i) => (
            <line
              key={`ridge-${i}`}
              x1={CX}
              y1={CY}
              x2={tip[0]}
              y2={tip[1]}
              stroke="#064e3b"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.28"
            />
          ))}
        </g>
      </svg>
    </span>
  );
}
