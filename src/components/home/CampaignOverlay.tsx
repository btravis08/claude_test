"use client";

import { motion, useInView } from "motion/react";
import type { Transition } from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
  Hero / Full Width text treatment: nav-style label texts on the sides,
  display type in the middle, sitting on the media's vertical center.
  The sides start 4% in from each edge and, while the image entrance is
  still settling, fade in as they travel outward to the 24px insets
  (Motion layout/FLIP, ease-in-out); the center text fades in place,
  centered on the container.

  Hovering the whole section animates the right element's underline
  exactly like the nav links (the section provides the `group`).
*/
const SPREAD: Transition = { duration: 0.7, ease: "easeInOut" };

export function CampaignOverlay({
  left,
  center,
  right,
}: {
  left?: string;
  center?: string;
  right?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (!inView) return;
    // kick off while the image entrance is still running
    const t = setTimeout(() => setGo(true), 300);
    return () => clearTimeout(t);
  }, [inView]);

  if (!left && !center && !right) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 flex items-center"
    >
      {/* 1fr/auto/1fr grid keeps the center text centered on the
          container regardless of the side texts' widths; the padding
          swap is what the sides travel through (FLIP) */}
      {/* each text fades in over the same ease-in-out as its travel */}
      <div
        className={`grid w-full grid-cols-[1fr_auto_1fr] items-center ${
          go ? "px-6" : "px-[4%]"
        }`}
      >
        {left !== undefined && (
          <motion.span
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={SPREAD}
            className="label col-start-1 justify-self-start font-medium"
          >
            {left}
          </motion.span>
        )}
        {center !== undefined && (
          <motion.span
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={SPREAD}
            className="col-start-2 justify-self-center font-display text-headline-lg"
          >
            {center}
          </motion.span>
        )}
        {right !== undefined && (
          <motion.span
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: go ? 1 : 0 }}
            transition={SPREAD}
            className="label relative col-start-3 justify-self-end font-medium"
          >
            {right}
            {/* nav-style underline, driven by hovering the whole section */}
            <span className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-current transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
          </motion.span>
        )}
      </div>
    </div>
  );
}
