"use client";

import { createContext, useContext, useRef } from "react";
import { motion, useInView } from "motion/react";

/*
  Generic section animation wrapper: the wrapper watches its own
  bounds and flips a context flag once 20% of the section has entered
  the viewport (once per page view). Reveal leaves anywhere inside
  read that flag and run their own delayed animation, so a section's
  whole choreography starts from a single trigger instead of each
  element tripping independently.

  Leaves:
  - RevealText — fades and rises into place
  - RevealLine — a rule that draws in from the left (scaleX)
*/

const RevealContext = createContext(false);
export const useSectionRevealed = () => useContext(RevealContext);

const EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];

export function SectionReveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <div ref={ref} className={className}>
      <RevealContext.Provider value={inView}>{children}</RevealContext.Provider>
    </div>
  );
}

export function RevealText({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const on = useSectionRevealed();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 12 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function RevealLine({
  delay = 0,
  className,
}: {
  delay?: number;
  className?: string;
}) {
  const on = useSectionRevealed();
  return (
    <motion.div
      aria-hidden
      className={`origin-left ${className ?? ""}`}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: on ? 1 : 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    />
  );
}
