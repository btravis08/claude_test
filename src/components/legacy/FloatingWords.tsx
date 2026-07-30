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
  Legacy "Floating Images" (Figma 33599:72535) — a pinned stage: the
  wrapper is 300vh tall, the stage sticks for the ride. As the user
  scrolls, "Pursue / Better / Always" fade in one after another while
  three images float across the stage right-to-left, each at its own
  speed with a long eased tail (the momentum feel), plus a slow
  vertical bob. When the last word has landed and the images have
  passed, the section unpins.

  Base positions come from the Figma frame (1440×1000): a 2:3 portrait
  top-center, a 4:3 landscape mid-left, a 2:1 wide lower-right. The
  words sit on the center line, justified across the full width.
*/

const GLIDE = cubicBezier(0.22, 1, 0.36, 1);

function FloatImage({
  progress,
  src,
  aspect,
  width,
  top,
  from,
  to,
  range,
  bob = 10,
  duration = 7,
}: {
  progress: MotionValue<number>;
  src: string;
  aspect: string;
  /* CSS width (vw-based, with a floor for small screens) */
  width: string;
  top: string;
  /* travel in vw, mapped over `range` of the section progress */
  from: number;
  to: number;
  range: [number, number];
  bob?: number;
  duration?: number;
}) {
  const x = useTransform(
    () =>
      `${from + (to - from) * slice(progress.get(), range[0], range[1], GLIDE)}vw`,
  );
  return (
    <motion.div
      className="absolute overflow-hidden rounded-xs"
      style={{ width, top, left: 0, x }}
    >
      {/* the float: a slow, endless bob layered under the travel */}
      <motion.div
        animate={{ y: [0, -bob, 0, bob * 0.6, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
        className={`relative w-full ${aspect}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}

const WORDS = ["Pursue", "Better", "Always"];
/* each word owns a slice of the pinned ride */
const WORD_RANGES: [number, number][] = [
  [0.06, 0.2],
  [0.3, 0.44],
  [0.54, 0.68],
];

/* progress→0..1 inside [a,b], clamped and eased — explicit so the
   mapping can't be reinterpreted (a word must never fade back out) */
function slice(p: number, a: number, b: number, ease?: (t: number) => number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return ease ? ease(t) : t;
}

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

export function FloatingWords({
  words = WORDS,
  images = {
    portrait: "/figma/legacy/float-putt.jpg",
    landscape: "/figma/legacy/float-crowd.jpg",
    wide: "/figma/legacy/float-shoes.jpg",
  },
}: {
  words?: string[];
  images?: { portrait: string; landscape: string; wide: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={ref} data-mode="light" className="relative h-[300vh] w-full bg-surface text-ink">
      <div className="sticky top-0 h-screen w-full overflow-hidden border-y border-line">
        {/* portrait, 2:3 — starts high right of its Figma seat, ends left */}
        <FloatImage
          progress={scrollYProgress}
          src={images.portrait}
          aspect="aspect-[2/3]"
          width="clamp(10.5rem, 18.5vw, 19rem)"
          top="2%"
          from={70}
          to={12}
          range={[0, 0.9]}
          bob={12}
          duration={7.5}
        />
        {/* landscape 4:3, mid-left seat */}
        <FloatImage
          progress={scrollYProgress}
          src={images.landscape}
          aspect="aspect-[4/3]"
          width="clamp(13rem, 26.4vw, 27rem)"
          top="52%"
          from={95}
          to={6}
          range={[0.08, 0.95]}
          bob={9}
          duration={6.5}
        />
        {/* wide 2:1, lower-right seat */}
        <FloatImage
          progress={scrollYProgress}
          src={images.wide}
          aspect="aspect-[2/1]"
          width="clamp(13rem, 26.4vw, 27rem)"
          top="74%"
          from={115}
          to={72}
          range={[0.16, 1]}
          bob={7}
          duration={8}
        />
        {/* the words ride above the images */}
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
