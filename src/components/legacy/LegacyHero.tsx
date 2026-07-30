"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

/*
  Legacy page introduction (Figma node 33982:60407) — a time-driven
  title sequence with scroll locked until it resolves:

    1. "A New Legacy" slides up into dead center (2s, dramatic bezier)
    2. holds for 1s
    3. the phrase splits — "A New" to the left edge, "Legacy" to the
       right — while the 4:3 campaign image expands from between the
       words until it fills the viewport; the text inverts to white
       as the film passes beneath it
    4. the page unlocks and scrolls normally

  The resting hero (what the Figma frame freezes mid-animation) is the
  full-bleed image with the split words at the edges, vertically
  centered. Reduced-motion users get that resting state immediately.
*/

/* One dramatic curve for every phase — hard in, hard out. */
const DRAMA = [0.85, 0, 0.15, 1] as const;

type Phase = "enter" | "hold" | "split" | "done";

export function LegacyHero({
  left = "A New",
  right = "Legacy",
  image = "/figma/legacy/hero.jpg",
}: {
  left?: string;
  right?: string;
  image?: string;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "enter");
  const lenis = useLenis();

  /* Scroll stays locked until the sequence resolves. */
  const locked = phase !== "done";
  useEffect(() => {
    if (!locked) {
      lenis?.start();
      return;
    }
    window.scrollTo(0, 0);
    lenis?.stop();
    /* Lenis intercepts wheel/touch; block keyboard scrolling too. */
    const keys = new Set([
      " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (keys.has(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [locked, lenis]);

  /* The 1s hold between arrival and the split. */
  useEffect(() => {
    if (phase !== "hold") return;
    const t = setTimeout(() => setPhase("split"), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const splitting = phase === "split" || phase === "done";
  /* Words: one centered line that pulls apart to the padded edges.
     justify-center + animated padding-free approach: the two words sit
     in a full-width row; before the split they huddle at the center
     (auto margins collapsed), after it they justify to the edges. */
  return (
    <section
      data-mode={splitting ? "dark" : "light"}
      className="relative h-screen w-full overflow-hidden bg-surface text-ink"
    >
      {/* The film: expands from the inter-word box to full bleed. */}
      <motion.div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        initial={false}
        animate={
          splitting
            ? { width: "100vw", height: "100vh", opacity: 1 }
            : {
                width: "min(51.7vw, 46rem)",
                height: "min(38.75vw, 34.5rem)",
                opacity: 0,
              }
        }
        transition={{ duration: 2.2, ease: DRAMA }}
        style={{ x: "-50%", y: "-50%" }}
        aria-hidden={!splitting}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt="Sun Day Red campaign"
          className="h-full w-full object-cover"
        />
        {/* flat 20% scrim, per the library's content overlay */}
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </motion.div>

      {/* The words. */}
      <motion.div
        className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center px-6"
        initial={reduced ? false : { y: "14vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: DRAMA }}
        onAnimationComplete={() => {
          if (phase === "enter") setPhase("hold");
        }}
      >
        <div className="relative flex w-full items-center justify-center">
          {/* Each word travels from the center cluster to its edge. */}
          <motion.p
            className="font-display text-headline-lg whitespace-nowrap"
            initial={false}
            animate={{
              x: 0,
              color: splitting ? "#ffffff" : "var(--ink)",
              opacity: splitting ? 1 : 0.8,
            }}
            transition={{
              duration: 2.2,
              ease: DRAMA,
              color: { duration: 0.9, delay: 0.9 },
            }}
            style={{
              position: splitting ? undefined : "relative",
              marginRight: "0.35em",
            }}
            layout
          >
            {left}
          </motion.p>
          <motion.p
            className="font-display text-headline-lg whitespace-nowrap"
            initial={false}
            animate={{
              color: splitting ? "#ffffff" : "var(--ink)",
              opacity: splitting ? 1 : 0.8,
            }}
            transition={{ color: { duration: 0.9, delay: 0.9 } }}
            layout
          >
            {right}
          </motion.p>
          {/* Spacer that forces the words apart when splitting: grows
              from 0 to full remaining width with the same curve. */}
          <motion.span
            className="order-first hidden"
            aria-hidden
          />
        </div>
      </motion.div>
    </section>
  );
}
