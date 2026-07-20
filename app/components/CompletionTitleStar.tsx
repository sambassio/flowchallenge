"use client";

import Image from "next/image";

/** Étoile de complétion (une par challenge gagné) — asset vert facetté 3D. */
export function CompletionTitleStar({
  className,
}: {
  className?: string;
}) {
  return (
    <Image
      src="/completion-star-green.png"
      alt=""
      aria-hidden
      width={192}
      height={190}
      priority
      className={
        className ??
        "h-[1.55rem] w-auto drop-shadow-[0_0_10px_rgba(52,211,153,0.35)] sm:h-[1.9rem] md:h-[2.3rem]"
      }
    />
  );
}
