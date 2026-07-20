"use client";

import Image from "next/image";

/** Étoile de complétion (badge à côté du titre) — asset vert facetté 3D. */
export function CompletionTitleStar({ count }: { count: number }) {
  if (count <= 0) return null;

  const label =
    count > 1 ? `Challenge terminé ${count} fois` : "Challenge terminé";

  return (
    <span
      className="inline-flex shrink-0 items-center self-center"
      title={label}
      aria-label={label}
    >
      <Image
        src="/completion-star-green.png"
        alt=""
        aria-hidden
        width={192}
        height={190}
        priority
        className="h-[1.55rem] w-auto drop-shadow-[0_0_10px_rgba(52,211,153,0.35)] sm:h-[1.9rem] md:h-[2.3rem]"
      />
    </span>
  );
}
