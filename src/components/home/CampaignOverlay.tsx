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

  `stack` (the homepage hero) swaps mobile to a bottom-aligned centered
  column: eyebrow + headline stacked, and the CTA as a full-width
  Primary Button Large resting 16px above the fixed mobile control bar
  on load (bar = bottom-4 + h-12 -> 80px of bottom padding).

  Hovering the whole section animates the right element's underline
  exactly like the nav links (the section provides the `group`).
*/
const SPREAD: Transition = { duration: 0.7, ease: "easeInOut" };

export function CampaignOverlay({
  left,
  center,
  right,
  stack = false,
}: {
  left?: string;
  center?: string;
  right?: string;
  stack?: boolean;
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

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: go ? 1 : 0 },
    transition: SPREAD,
  } as const;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      {/* mobile hero: bottom-aligned centered stack + full-width CTA */}
      {stack && (
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-6 px-4 pb-20 md:hidden">
          <div className="flex flex-col items-center gap-4 text-center">
            {left !== undefined && (
              <motion.span {...fade} className="label font-medium">
                {left}
              </motion.span>
            )}
            {center !== undefined && (
              <motion.span {...fade} className="font-display text-headline-lg">
                {center}
              </motion.span>
            )}
          </div>
          {right !== undefined && (
            <motion.span
              {...fade}
              className="label flex h-[2.875rem] w-full items-center justify-center rounded-xs bg-btn font-medium text-btn-fg"
            >
              {right}
            </motion.span>
          )}
        </div>
      )}

      {/* desktop (and non-stacked mobile): the centered 3-column row */}
      <div
        className={`absolute inset-0 items-center ${stack ? "hidden md:flex" : "flex"}`}
      >
        {/* 1fr/auto/1fr grid keeps the center text centered on the
            container regardless of the side texts' widths; the padding
            swap is what the sides travel through (FLIP) */}
        {/* each text fades in over the same ease-in-out as its travel */}
        <div
          className={`grid w-full grid-cols-[1fr_auto_1fr] items-center ${
            go ? "px-4 md:px-6" : "px-[4%]"
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
    </div>
  );
}
