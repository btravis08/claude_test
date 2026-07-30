"use client";

import {
  cubicBezier,
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";

import { Logo } from "@/components/Logo";

/*
  Legacy horizontal scatter strip (Figma: the wide lorem collage; art
  direction: landonorris.com's gallery). The section pins and vertical
  scroll slides a ~2.6-viewport-wide canvas of scattered, captioned
  images right-to-left, with serif quote blocks set among them.

  The frames don't parallax against the canvas — they ride it 1:1.
  The image INSIDE each frame is oversized and translates a touch
  slower than the travel (clipped by its frame), so every photo drags
  quietly as it crosses the screen.
*/

const GLIDE = cubicBezier(0.22, 1, 0.36, 1);
/* canvas geometry, in vw of the pinned stage */
const TRACK = 260;
const OVERFLOW = TRACK - 100;
/* inner-parallax amplitude (% of frame width) */
const A = 7;

function slice(p: number, a: number, b: number, ease?: (t: number) => number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return ease ? ease(t) : t;
}

interface StripImage {
  src: string;
  meta: string;
  aspect: string;
  /* track position: left in vw, top in % of stage height */
  left: number;
  top: string;
  width: string;
  /* width in vw for the visibility window math */
  w: number;
  tone?: "tint";
}

const IMAGES: StripImage[] = [
  { src: "/figma/legacy/float-putt.jpg",  meta: "Practice Green, 2024", aspect: "aspect-[2/3]", left: 5,   top: "10%", width: "clamp(8rem, 12vw, 14rem)",  w: 12 },
  { src: "/figma/journal/stream-03.jpg",  meta: "Fitting Room, 2024",   aspect: "aspect-[3/4]", left: 16,  top: "48%", width: "clamp(8rem, 13vw, 15rem)",  w: 13, tone: "tint" },
  { src: "/figma/journal/stream-11.jpg",  meta: "Media Day, 2024",      aspect: "aspect-[3/4]", left: 36,  top: "22%", width: "clamp(15rem, 30vw, 34rem)", w: 30 },
  { src: "/figma/legacy/float-crowd.jpg", meta: "Riviera, 2024",        aspect: "aspect-[4/3]", left: 84,  top: "10%", width: "clamp(9rem, 15vw, 17rem)",  w: 15 },
  { src: "/figma/journal/stream-10.jpg",  meta: "St Andrews, 2022",     aspect: "aspect-[3/2]", left: 96,  top: "54%", width: "clamp(9rem, 16vw, 18rem)",  w: 16 },
  { src: "/figma/legacy/float-shoes.jpg", meta: "Pebble Beach, 2024",   aspect: "aspect-[2/1]", left: 120, top: "34%", width: "clamp(11rem, 20vw, 22rem)", w: 20 },
  { src: "/figma/legacy/hero.jpg",        meta: "Studio, 2024",         aspect: "aspect-[4/3]", left: 152, top: "10%", width: "clamp(16rem, 34vw, 38rem)", w: 34 },
  { src: "/figma/journal/stream-06.jpg",  meta: "Sawgrass, 2024",       aspect: "aspect-[4/3]", left: 210, top: "9%",  width: "clamp(9rem, 15vw, 17rem)",  w: 15 },
  { src: "/figma/journal/stream-05.jpg",  meta: "The Range, 2024",      aspect: "aspect-[4/3]", left: 233, top: "50%", width: "clamp(8rem, 13vw, 15rem)",  w: 13 },
];

const QUOTES = [
  { text: "Pursue better. Always.", left: 34, top: "9%", width: "clamp(14rem, 22vw, 24rem)", w: 22 },
  { text: "You carry the legacy of a champion.", left: 152, top: "66%", width: "clamp(15rem, 26vw, 28rem)", w: 26 },
];

/* an item's slice of the ride: from entering at the right edge to
   leaving at the left */
const windowFor = (left: number, w: number): [number, number] => [
  Math.max(0, (left - 100) / OVERFLOW),
  Math.min(1, (left + w) / OVERFLOW),
];

function StripFrame({
  progress,
  image,
}: {
  progress: MotionValue<number>;
  image: StripImage;
}) {
  const [a, b] = windowFor(image.left, image.w);
  /* the inner image lags the travel: it slides from -A to +A across
     the frame's pass, opposite the canvas' leftward motion */
  const x = useTransform(() => `${-A + 2 * A * slice(progress.get(), a, b)}%`);
  return (
    <div
      className="absolute"
      style={{ left: `${image.left}vw`, top: image.top, width: image.width }}
    >
      <p className="label mb-2 text-ink-2">{image.meta.toUpperCase()}</p>
      <div className={`relative w-full overflow-hidden rounded-xs bg-surface-2 ${image.aspect}`}>
        <motion.div
          style={{ x, left: `-${A}%`, width: `${100 + A * 2}%` }}
          className="absolute inset-y-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt="" className="h-full w-full object-cover" />
        </motion.div>
        {image.tone === "tint" && (
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
          {IMAGES.map((image) => (
            <StripFrame key={`${image.src}-${image.left}`} progress={scrollYProgress} image={image} />
          ))}
          {QUOTES.map((quote) => (
            <div
              key={quote.text}
              className="absolute flex flex-col gap-5"
              style={{ left: `${quote.left}vw`, top: quote.top, width: quote.width }}
            >
              <p className="font-display text-headline-sm leading-snug text-ink">
                {quote.text}
              </p>
              <Logo className="h-4 w-auto text-ink" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
