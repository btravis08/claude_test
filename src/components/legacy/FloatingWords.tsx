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
  Legacy horizontal gallery (Figma 33599:72159 — "Floating Images",
  desktop symbol). The section pins and vertical scroll slides the
  4166×1000 canvas (289.3vw at the 1440 frame) right-to-left.

  Geometry is the comp's, converted to vw/vh of the stage:
  - three card sizes: 266px (4:5 media), 200/308px (square media),
    653px feature (square media)
  - every card: label-sm caption at 50% ink, 12.6px above the media
  - two 460px serif paragraphs at title-sm, seated by the features

  Frames ride the canvas 1:1; the oversized image inside each frame
  translates a touch slower than the travel (clipped inner parallax).
*/

const GLIDE = cubicBezier(0.22, 1, 0.36, 1);
/* canvas geometry from the comp (per 1440×1000 frame), in vw/vh */
const TRACK = 289.31;
const OVERFLOW = TRACK - 100;
/* inner-parallax amplitude (% of frame width) */
const A = 7;

function slice(p: number, a: number, b: number, ease?: (t: number) => number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return ease ? ease(t) : t;
}

type Size = "sm" | "md" | "lg" | "xl";

/* card widths from the comp: 200 / 266 / 308 / 653 at 1440 */
const SIZE: Record<Size, { width: string; w: number; aspect: string }> = {
  sm: { width: "max(6.5rem, 13.889vw)", w: 13.889, aspect: "aspect-square" },
  md: { width: "max(8.5rem, 18.472vw)", w: 18.472, aspect: "aspect-[320/400]" },
  lg: { width: "max(10rem, 21.389vw)", w: 21.389, aspect: "aspect-square" },
  xl: { width: "max(16rem, 45.347vw)", w: 45.347, aspect: "aspect-square" },
};

interface Card {
  src: string;
  meta: string;
  size: Size;
  left: number; // vw
  top: string;  // % of stage height
  tone?: "tint";
}

/* the comp's ten cards, left to right */
const CARDS: Card[] = [
  { src: "/figma/legacy/float-putt.jpg",  meta: "Practice Green, 2024", size: "md", left: 5.08,   top: "11.03%" },
  { src: "/figma/journal/stream-03.jpg",  meta: "Fitting Room, 2024",   size: "lg", left: 22.02,  top: "52.33%", tone: "tint" },
  { src: "/figma/journal/stream-11.jpg",  meta: "Media Day, 2024",      size: "xl", left: 50.76,  top: "28.61%" },
  { src: "/figma/journal/stream-10.jpg",  meta: "St Andrews, 2022",     size: "sm", left: 104.53, top: "11.03%" },
  { src: "/figma/legacy/float-crowd.jpg", meta: "Riviera, 2024",        size: "lg", left: 113.14, top: "50.31%" },
  { src: "/figma/journal/stream-05.jpg",  meta: "The Range, 2024",      size: "md", left: 151.56, top: "61.2%" },
  { src: "/figma/legacy/float-shoes.jpg", meta: "Pebble Beach, 2024",   size: "sm", left: 166.24, top: "19.8%" },
  { src: "/figma/legacy/hero.jpg",        meta: "Studio, 2024",         size: "xl", left: 193.2,  top: "6.06%" },
  { src: "/figma/journal/stream-06.jpg",  meta: "Sawgrass, 2024",       size: "lg", left: 250.29, top: "52.33%" },
  { src: "/figma/legacy/float-putt.jpg",  meta: "Sunday, 2024",         size: "md", left: 265.76, top: "11.03%" },
];

/* the comp's two 460px paragraphs, seated by the feature cards */
const TEXTS = [
  {
    copy: "Pursue better, always. From first-light practice rounds to Sunday's final walk, every piece is built to move the way a champion moves.",
    left: 50.76,
    top: "11.88%",
  },
  {
    copy: "You carry the legacy of a champion. You become part of the Sun Day Red story — written one Sunday at a time.",
    left: 193.2,
    top: "81.93%",
  },
];

const windowFor = (left: number, w: number): [number, number] => [
  Math.max(0, (left - 100) / OVERFLOW),
  Math.min(1, (left + w) / OVERFLOW),
];

function GalleryCard({
  progress,
  card,
}: {
  progress: MotionValue<number>;
  card: Card;
}) {
  const { width, w, aspect } = SIZE[card.size];
  const [a, b] = windowFor(card.left, w);
  /* the inner image lags the leftward travel */
  const x = useTransform(() => `${-A + 2 * A * slice(progress.get(), a, b)}%`);
  return (
    <div
      className="absolute"
      style={{ left: `${card.left}vw`, top: card.top, width }}
    >
      <p className="label mb-[0.7875rem] font-medium text-ink-2">
        {card.meta.toUpperCase()}
      </p>
      <div className={`relative w-full overflow-hidden bg-surface-2 ${aspect}`}>
        <motion.div
          style={{ x, left: `-${A}%`, width: `${100 + A * 2}%` }}
          className="absolute inset-y-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.src} alt="" className="h-full w-full object-cover" />
        </motion.div>
        {card.tone === "tint" && (
          <div className="pointer-events-none absolute inset-0 bg-surface/45 mix-blend-color" aria-hidden />
        )}
      </div>
    </div>
  );
}

export function FloatingWords() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(
    () => `${-OVERFLOW * slice(scrollYProgress.get(), 0.02, 0.98, GLIDE)}vw`,
  );

  return (
    <div ref={ref} data-mode="light" className="relative h-[400vh] w-full bg-surface text-ink">
      <div className="sticky top-0 h-screen w-full overflow-hidden border-y border-line">
        <motion.div style={{ x, width: `${TRACK}vw` }} className="relative h-full">
          {CARDS.map((card, i) => (
            <GalleryCard key={i} progress={scrollYProgress} card={card} />
          ))}
          {TEXTS.map((text) => (
            <p
              key={text.left}
              className="absolute font-display text-title-sm text-ink"
              style={{
                left: `${text.left}vw`,
                top: text.top,
                width: "max(16rem, 31.944vw)",
              }}
            >
              {text.copy}
            </p>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
