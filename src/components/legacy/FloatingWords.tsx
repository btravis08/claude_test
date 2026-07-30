"use client";

import {
  cubicBezier,
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";

/*
  Legacy "Floating Images" (Figma 33599:72535) — a long pinned stage
  (450vh wrapper). "Pursue / Better / Always" fade in one after
  another while a field of images floats right-to-left with slow,
  eased momentum and a gentle bob:

  - the three images from the comp START in their Figma seats,
    already scattered around the stage, and drift left slowly
  - four more images begin off-screen right and cross the stage over
    the ride, so there's always something arriving
  - after the third word lands and the field has passed, it unpins
*/

const GLIDE = cubicBezier(0.22, 1, 0.36, 1);

/* progress→0..1 inside [a,b], clamped and eased */
function slice(p: number, a: number, b: number, ease?: (t: number) => number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return ease ? ease(t) : t;
}

interface Drift {
  src: string;
  aspect: string;
  width: string;
  top: string;
  /* travel in vw over `range` of the ride */
  from: number;
  to: number;
  range: [number, number];
  bob: number;
  duration: number;
}

/* The comp's three images, seated where Figma puts them, drifting
   slowly; plus four arrivals from off-screen right. */
const FIELD: Drift[] = [
  /* portrait 2:3 — top center-left seat (Figma x 418/1440) */
  {
    src: "/figma/legacy/float-putt.jpg",
    aspect: "aspect-[2/3]",
    width: "clamp(10.5rem, 18.5vw, 19rem)",
    top: "2%",
    from: 29,
    to: 9,
    range: [0, 1],
    bob: 12,
    duration: 7.5,
  },
  /* landscape 4:3 — mid-left seat (Figma x 92/1440) */
  {
    src: "/figma/legacy/float-crowd.jpg",
    aspect: "aspect-[4/3]",
    width: "clamp(13rem, 26.4vw, 27rem)",
    top: "52%",
    from: 6.4,
    to: -14,
    range: [0, 1],
    bob: 9,
    duration: 6.5,
  },
  /* wide 2:1 — lower-right seat (Figma x 1086/1440) */
  {
    src: "/figma/legacy/float-shoes.jpg",
    aspect: "aspect-[2/1]",
    width: "clamp(13rem, 26.4vw, 27rem)",
    top: "74%",
    from: 75,
    to: 48,
    range: [0, 1],
    bob: 7,
    duration: 8,
  },
  /* arrivals — editorial shots crossing from off-screen right */
  {
    src: "/figma/journal/stream-11.jpg",
    aspect: "aspect-[3/4]",
    width: "clamp(9.5rem, 16vw, 17rem)",
    top: "12%",
    from: 108,
    to: 34,
    range: [0.05, 1],
    bob: 10,
    duration: 7,
  },
  {
    src: "/figma/journal/stream-06.jpg",
    aspect: "aspect-[4/3]",
    width: "clamp(11rem, 20vw, 21rem)",
    top: "38%",
    from: 118,
    to: 52,
    range: [0.18, 1],
    bob: 8,
    duration: 8.5,
  },
  {
    src: "/figma/journal/stream-10.jpg",
    aspect: "aspect-[3/2]",
    width: "clamp(9rem, 15vw, 16rem)",
    top: "66%",
    from: 106,
    to: 14,
    range: [0.32, 1],
    bob: 11,
    duration: 6,
  },
  {
    src: "/figma/journal/stream-03.jpg",
    aspect: "aspect-[3/4]",
    width: "clamp(10rem, 17vw, 18rem)",
    top: "6%",
    from: 122,
    to: 64,
    range: [0.5, 1],
    bob: 9,
    duration: 7.5,
  },
];

function FloatImage({
  progress,
  drift,
}: {
  progress: MotionValue<number>;
  drift: Drift;
}) {
  const { from, to, range } = drift;
  const x = useTransform(
    () => `${from + (to - from) * slice(progress.get(), range[0], range[1], GLIDE)}vw`,
  );
  return (
    <motion.div
      className="absolute overflow-hidden rounded-xs"
      style={{ width: drift.width, top: drift.top, left: 0, x }}
    >
      <motion.div
        animate={{ y: [0, -drift.bob, 0, drift.bob * 0.6, 0] }}
        transition={{ duration: drift.duration, repeat: Infinity, ease: "easeInOut" }}
        className={`relative w-full ${drift.aspect}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={drift.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}

const WORDS = ["Pursue", "Better", "Always"];
/* each word owns an early slice; the field keeps moving long after */
const WORD_RANGES: [number, number][] = [
  [0.04, 0.14],
  [0.22, 0.32],
  [0.4, 0.5],
];

function FadeWord({
  progress,
  word,
  range,
}: {
  progress: MotionValue<number>;
  word: string;
  range: [number, number];
}) {
  const opacity = useTransform(() => slice(progress.get(), range[0], range[1]));
  const y = useTransform(
    () => 24 * (1 - slice(progress.get(), range[0], range[1], GLIDE)),
  );
  return (
    <motion.p
      style={{ opacity, y }}
      className="font-display text-headline-lg tracking-[-0.02em]"
    >
      {word}
    </motion.p>
  );
}

export function FloatingWords({ words = WORDS }: { words?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} data-mode="light" className="relative h-[450vh] w-full bg-surface text-ink">
      <div className="sticky top-0 h-screen w-full overflow-hidden border-y border-line">
        {FIELD.map((drift) => (
          <FloatImage key={drift.src} progress={scrollYProgress} drift={drift} />
        ))}
        {/* the words ride above the field */}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-start justify-between px-6">
          {words.slice(0, 3).map((word, i) => (
            <FadeWord
              key={word}
              progress={scrollYProgress}
              word={word}
              range={WORD_RANGES[i] ?? WORD_RANGES[2]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
