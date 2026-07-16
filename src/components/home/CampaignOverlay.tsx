"use client";

import { motion, useInView } from "motion/react";
import type { Transition } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";

/*
  Hero / Full Width text treatment: three display-type elements sit on
  the media's vertical center. On load (after the image entrance) they
  fade in clustered at the center, then spread — left to the left edge,
  right to the right edge, center staying put (Motion layout/FLIP).

  Hovering the whole section animates the right element's underline
  exactly like the nav links (the section provides the `group`).
*/
const SPREAD: Transition = { duration: 0.9, ease: [...MEDIA_EASE] };

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
  const [shown, setShown] = useState(false);
  const [spread, setSpread] = useState(false);

  useEffect(() => {
    if (!inView) return;
    // image entrance (0.9s) → texts fade in at center → spread apart
    const reveal = setTimeout(() => setShown(true), 900);
    const apart = setTimeout(() => setSpread(true), 1500);
    return () => {
      clearTimeout(reveal);
      clearTimeout(apart);
    };
  }, [inView]);

  if (!left && !center && !right) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 flex items-center"
    >
      <motion.div
        className={`flex w-full items-center px-6 font-display text-title-sm ${
          spread ? "justify-between" : "justify-center gap-4"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
      >
        {left !== undefined && (
          <motion.span layout transition={SPREAD}>
            {left}
          </motion.span>
        )}
        {center !== undefined && (
          <motion.span layout transition={SPREAD}>
            {center}
          </motion.span>
        )}
        {right !== undefined && (
          <motion.span layout transition={SPREAD} className="relative">
            {right}
            {/* nav-style underline, driven by hovering the whole section */}
            <span className="absolute inset-x-0 -bottom-1 h-px origin-right scale-x-0 bg-current transition-transform duration-300 group-hover:origin-left group-hover:scale-x-100" />
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
