"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

/*
  Legacy page introduction (Figma 33982:60407) — a time-driven title
  sequence with scroll locked until it resolves:

    1. "A New Legacy" slides up into dead center (2s, dramatic bezier)
    2. holds for a beat
    3. the phrase splits — "A New" to the left edge, "Legacy" to the
       right — while the campaign image expands from between the words
       until it fills the viewport; the words invert to white as the
       film passes beneath them
    4. the page unlocks and scrolls normally

  The Figma frame freezes the split mid-flight (image at 743px between
  the parted words); the resting hero is the full-bleed image with the
  words at the edges, vertically centered, at 80% white. Reduced
  motion goes straight to the resting state with no lock.
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
  const [phase, setPhase] = useState<Phase>("enter");
  const lenis = useLenis();

  useEffect(() => {
    if (reduced) setPhase("done");
  }, [reduced]);

  /* Scroll stays locked until the sequence resolves. */
  const locked = phase !== "done";
  useEffect(() => {
    if (!locked) return;
    window.scrollTo(0, 0);
    lenis?.stop();
    /* Lenis owns wheel/touch; keyboard scrolling is blocked here. */
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

  /* The beat between arrival and the split, then the split's length. */
  useEffect(() => {
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("split"), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "split") {
      const t = setTimeout(() => setPhase("done"), 2400);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const splitting = phase === "split" || phase === "done";

  return (
    <section
      /* the surface stays light while the film expands over it; the
         section only reads as dark once the image owns the viewport */
      data-mode={phase === "done" ? "dark" : "light"}
      className="relative h-screen w-full overflow-hidden bg-surface"
    >
      {/* The film: grows from the slot between the words to full bleed. */}
      <motion.div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        initial={false}
        animate={
          splitting
            ? { width: "100vw", height: "100vh", opacity: 1 }
            : { width: "26vw", height: "19.5vw", opacity: 0 }
        }
        transition={{
          duration: 2.4,
          ease: DRAMA,
          opacity: { duration: 0.5, ease: "easeOut" },
        }}
        style={{ x: "-50%", y: "-50%" }}
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

      {/* The words: one centered cluster that parts to the edges.
          justify swap + FLIP layout animation carries the travel. */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6">
        <motion.div
          initial={reduced ? false : { y: "14vh", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 2, ease: DRAMA }}
          onAnimationComplete={() => {
            setPhase((p) => (p === "enter" ? "hold" : p));
          }}
          className={`flex w-full items-center ${
            splitting ? "justify-between" : "justify-center gap-[0.35em]"
          }`}
        >
          <motion.p
            layout
            transition={{
              layout: { duration: 1.6, ease: DRAMA },
              color: { duration: 0.8, delay: 1.3 },
            }}
            initial={false}
            animate={{ color: splitting ? "#ffffff" : "#161716" }}
            className="font-display text-headline-lg whitespace-nowrap opacity-80"
          >
            {left}
          </motion.p>
          <motion.p
            layout
            transition={{
              layout: { duration: 1.6, ease: DRAMA },
              color: { duration: 0.8, delay: 1.3 },
            }}
            initial={false}
            animate={{ color: splitting ? "#ffffff" : "#161716" }}
            className="font-display text-headline-lg whitespace-nowrap opacity-80"
          >
            {right}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
