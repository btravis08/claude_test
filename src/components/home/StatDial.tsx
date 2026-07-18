"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

/*
  Radial tick dial for the tech-specs stats. The ring is 45 ticks on an
  8° rhythm (3° tick / 5° gap, matching the old conic-gradient mask);
  the value's share reads in ink over a static hairline-tone ring.

  On first scroll into view the ink ticks draw in clockwise from
  12 o'clock: each tick strokes outward from its inner end
  (pathLength 0 → 1) on an ease-out curve, staggered tightly enough
  that neighbors overlap mid-draw.
*/

const TICKS = 45;
const STEP = 360 / TICKS;
const R_OUT = 32;
const R_IN = 20;

/* inner→outer path so pathLength draws the tick outward */
const tickPath = (i: number) => {
  const a = ((-90 + i * STEP) * Math.PI) / 180;
  const x1 = 32 + R_IN * Math.cos(a);
  const y1 = 32 + R_IN * Math.sin(a);
  const x2 = 32 + R_OUT * Math.cos(a);
  const y2 = 32 + R_OUT * Math.sin(a);
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} L ${x2.toFixed(3)} ${y2.toFixed(3)}`;
};

export function StatDial({ value = 0, label }: { value?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const filled = Math.round((pct / 100) * TICKS);
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <div className="flex shrink-0 items-center gap-3">
      <svg
        ref={ref}
        aria-hidden
        viewBox="0 0 64 64"
        className="size-16 overflow-visible"
        strokeWidth={1.6}
      >
        {/* full hairline ring underneath; the value's ticks draw over it */}
        {Array.from({ length: TICKS }, (_, i) => (
          <path key={i} d={tickPath(i)} className="stroke-[var(--line)]" />
        ))}
        {Array.from({ length: filled }, (_, i) => {
          return (
            <motion.path
              key={i}
              d={tickPath(i)}
              className="stroke-[var(--ink)]"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: inView ? 1 : 0 }}
              transition={{
                duration: 0.45,
                delay: i * 0.035,
                ease: [0.33, 1, 0.68, 1],
              }}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-0.5 font-mono text-[0.6875rem] uppercase leading-tight tracking-wide">
        <p className="max-w-32 text-ink">{label}</p>
        <p className="text-ink-3">{pct}/100</p>
      </div>
    </div>
  );
}
