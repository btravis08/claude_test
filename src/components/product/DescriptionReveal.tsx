"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

/*
  PDP serif description fill: the whole passage renders in the
  disabled text tone, and once it scrolls into view the real ink
  color wipes over each word left to right (a clip-path overlay per
  word, so the text never moves). The product name at the head of the
  copy fills first on a slower cadence; after a 1s hold the rest of
  the passage sweeps through in reading order with tightly overlapped
  word wipes.
*/

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const NAME_STAGGER = 0.25;
const NAME_DUR = 0.8;
const PAUSE = 1;
const REST_STAGGER = 0.07;
const REST_DUR = 0.6;

function FillWord({
  word,
  delay,
  duration,
  active,
}: {
  word: string;
  delay: number;
  duration: number;
  active: boolean;
}) {
  return (
    <span className="relative inline-block">
      <span className="text-ink-disabled">{word}</span>
      <motion.span
        aria-hidden
        className="absolute inset-0 text-ink"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: active ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration, delay, ease: EASE }}
      >
        {word}
      </motion.span>
    </span>
  );
}

export function DescriptionReveal({
  name,
  paragraphs,
  className,
}: {
  /* product title — the leading phrase containing it fills first */
  name?: string;
  paragraphs: string[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  /* how many words of the first paragraph belong to the name phrase:
     everything up to the end of the title match (covers "The
     Presidio" when the title is "Presidio") */
  const first = paragraphs[0] ?? "";
  const idx = name ? first.toLowerCase().indexOf(name.toLowerCase()) : -1;
  let nameCount = 0;
  if (idx >= 0) {
    const end = idx + (name as string).length;
    let chars = 0;
    for (const w of first.split(/\s+/)) {
      if (chars >= end) break;
      nameCount += 1;
      chars += w.length + 1;
    }
  }
  const nameEnd = nameCount > 0 ? (nameCount - 1) * NAME_STAGGER + NAME_DUR : -PAUSE;

  let k = 0;
  const wordDelay = () => {
    const i = k++;
    return i < nameCount
      ? { delay: i * NAME_STAGGER, duration: NAME_DUR }
      : {
          delay: nameEnd + PAUSE + (i - nameCount) * REST_STAGGER,
          duration: REST_DUR,
        };
  };

  return (
    <div ref={ref} className={className}>
      {paragraphs.map((para, p) => (
        <p key={p}>
          {para
            .split(/\s+/)
            .filter(Boolean)
            .map((word, j) => {
              const t = wordDelay();
              return (
                <span key={j}>
                  {j > 0 && " "}
                  <FillWord word={word} active={inView} {...t} />
                </span>
              );
            })}
        </p>
      ))}
    </div>
  );
}
