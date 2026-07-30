"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

import { ArrowUpRight } from "@/components/icons";

/*
  Legacy "Text Block" (Figma 33599:71930 / 34023:185081) — a full-
  viewport centered column: a vertical hairline dropping from the
  section edge, an eyebrow, a Feature Deck paragraph at title-lg on a
  700px measure, then an optional CTA or the embossed tiger mark, and
  the hairline resuming to the bottom edge.

  The paragraph carries the split-text scroll animation: it's split
  into words, and each word resolves from a faint 15% to full ink as
  the section scrolls through the viewport — scrubbed, so it plays in
  both directions. The hairlines draw with the same progress.
*/

function Rule({ progress, origin }: { progress: import("motion/react").MotionValue<number>; origin: "top" | "bottom" }) {
  return (
    <div className="flex min-h-0 w-px flex-1 justify-center">
      <motion.span
        className="w-px bg-line-2"
        style={{
          height: "100%",
          scaleY: progress,
          transformOrigin: origin === "top" ? "top" : "bottom",
        }}
      />
    </div>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: import("motion/react").MotionValue<number>;
  range: [number, number];
}) {
  /* fill AND focus: each word resolves from faint + blurred to full
     ink and sharp as its slice of the reveal passes */
  const t = () => {
    const p = progress.get();
    return Math.min(1, Math.max(0, (p - range[0]) / (range[1] - range[0])));
  };
  const opacity = useTransform(() => t());
  const filter = useTransform(() => `blur(${((1 - t()) * 8).toFixed(2)}px)`);
  return (
    <motion.span style={{ opacity, filter }} className="inline-block">
      {children}&nbsp;
    </motion.span>
  );
}

export function SplitTextBlock({
  mode = "light",
  eyebrow,
  text,
  cta,
  markImage,
}: {
  mode?: "light" | "light-mid";
  eyebrow: string;
  text: string;
  /* black button below the copy (OUR MANTRA blocks) */
  cta?: string;
  /* embossed mark below the copy instead (OUR MARK block) */
  markImage?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const pRef = useRef<HTMLParagraphElement>(null);
  /* The rules draw over the section's full pass... */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "center center"],
  });
  /* ...but the words hold until the paragraph itself is 40% up from
     the viewport bottom, then resolve over a long runway — and the
     progress is sprung, so the cascade trails the scroll with its own
     ease instead of tracking it 1:1. */
  const { scrollYProgress: rawReveal } = useScroll({
    target: pRef,
    offset: ["start 0.6", "start 0.2"],
  });
  const reveal = useSpring(rawReveal, { stiffness: 55, damping: 22, mass: 0.8 });
  const words = text.split(/\s+/).filter(Boolean);
  const span = 0.75; // words finish resolving at 75% of the pass
  const per = span / words.length;

  return (
    <section
      ref={ref}
      data-mode={mode}
      className="flex h-screen w-full flex-col items-center justify-center gap-12 bg-surface px-6 text-ink"
    >
      <Rule progress={scrollYProgress} origin="top" />
      <p className="label font-medium">{eyebrow.toUpperCase()}</p>
      <p ref={pRef} className="max-w-[43.75rem] text-center font-display text-title-md">
        {words.map((word, i) => (
          <Word
            key={i}
            progress={reveal}
            range={[i * per, i * per + per * 3]}
          >
            {word}
          </Word>
        ))}
      </p>
      {cta && (
        <a
          href="#"
          className="label flex h-12 min-w-[9.375rem] items-center justify-center gap-1.5 rounded-xs bg-btn px-[1.125rem] font-medium text-btn-fg transition-opacity hover:opacity-80"
        >
          {cta}
          <ArrowUpRight />
        </a>
      )}
      {markImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={markImage}
          alt="Sun Day Red tiger mark"
          className="w-full max-w-[32.375rem]"
        />
      )}
      <Rule progress={scrollYProgress} origin="bottom" />
    </section>
  );
}
