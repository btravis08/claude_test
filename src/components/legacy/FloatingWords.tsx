"use client";

import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
  Legacy horizontal gallery (Figma 33599:72159 — "Floating Images"
  desktop symbol, a 4166×1000 canvas). The section pins and vertical
  scroll slides the canvas right-to-left.

  Every measurement scales from viewport HEIGHT (the comp's 1000px
  frame = 100vh), so the composition — card sizes, gaps, top and
  bottom margins — holds at any viewport aspect. The travel is
  locked linearly to the scroll (Lenis supplies the glide); inner
  images visibly trail their frames (clipped inner parallax).
*/

/* design px (1000-tall frame) → vh: divide by 10 */
const vh = (d: number) => `${d / 10}vh`;
const TRACK_D = 4166;
/* inner-parallax amplitude (% of frame width) — generous enough that
   the photo visibly trails its frame across the pass */
const A = 14;

interface Card {
  src: string;
  meta: string;
  /* design-frame geometry, px */
  x: number;
  y: number;
  w: number;
  aspect: string;
  tone?: "tint";
}

/* the comp's ten Interactive Gallery Cards, left to right */
const CARDS: Card[] = [
  { src: "/figma/legacy/float-putt.jpg",  meta: "Practice Green, 2024", x: 73.1,   y: 110.3, w: 266, aspect: "aspect-[320/400]" },
  { src: "/figma/journal/stream-03.jpg",  meta: "Fitting Room, 2024",   x: 317.1,  y: 523.3, w: 308, aspect: "aspect-square", tone: "tint" },
  { src: "/figma/journal/stream-11.jpg",  meta: "Media Day, 2024",      x: 730.9,  y: 286.1, w: 653, aspect: "aspect-square" },
  { src: "/figma/journal/stream-10.jpg",  meta: "St Andrews, 2022",     x: 1505.3, y: 110.3, w: 200, aspect: "aspect-square" },
  { src: "/figma/legacy/float-crowd.jpg", meta: "Riviera, 2024",        x: 1629.2, y: 503.1, w: 308, aspect: "aspect-square" },
  { src: "/figma/journal/stream-05.jpg",  meta: "The Range, 2024",      x: 2182.5, y: 612,   w: 266, aspect: "aspect-[320/400]" },
  { src: "/figma/legacy/float-shoes.jpg", meta: "Pebble Beach, 2024",   x: 2393.9, y: 198,   w: 200, aspect: "aspect-square" },
  { src: "/figma/legacy/hero.jpg",        meta: "Studio, 2024",         x: 2782.1, y: 60.6,  w: 653, aspect: "aspect-square" },
  { src: "/figma/journal/stream-06.jpg",  meta: "Sawgrass, 2024",       x: 3604.2, y: 523.3, w: 308, aspect: "aspect-square" },
  { src: "/figma/legacy/float-putt.jpg",  meta: "Sunday, 2024",         x: 3826.9, y: 110.3, w: 266, aspect: "aspect-[320/400]" },
];

/* the comp's two 460px paragraphs, seated by the feature cards */
const TEXTS = [
  {
    copy: "Pursue better, always. From first-light practice rounds to Sunday's final walk, every piece is built to move the way a champion moves.",
    x: 730.9,
    y: 118.8,
  },
  {
    copy: "You carry the legacy of a champion. You become part of the Sun Day Red story — written one Sunday at a time.",
    x: 2782.1,
    y: 819.3,
  },
];

interface Geom {
  /* px the canvas overflows the viewport */
  overflow: number;
  /* screen px per design px */
  scale: number;
  vw: number;
}

export function FloatingWords() {
  const ref = useRef<HTMLDivElement>(null);
  const [geom, setGeom] = useState<Geom>({ overflow: 1, scale: 0.9, vw: 1440 });

  useEffect(() => {
    const measure = () => {
      const scale = window.innerHeight / 1000;
      setGeom({
        overflow: Math.max(1, TRACK_D * scale - window.innerWidth),
        scale,
        vw: window.innerWidth,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  /* linear, locked to the scroll — Lenis provides the glide; any
     smoothing layered on top detaches the travel from the input and
     rushes to catch up */
  const x = useTransform(() => -geom.overflow * scrollYProgress.get());

  return (
    <div ref={ref} data-mode="light" className="relative h-[550vh] w-full bg-surface text-ink">
      <div className="sticky top-0 h-screen w-full overflow-hidden border-y border-line">
        <motion.div style={{ x, width: vh(TRACK_D) }} className="relative h-full">
          {CARDS.map((card, i) => (
            <GalleryCard key={i} progress={scrollYProgress} geom={geom} card={card} />
          ))}
          {TEXTS.map((text) => (
            <p
              key={text.x}
              className="absolute font-display leading-[1.1] text-ink"
              style={{
                left: vh(text.x),
                top: vh(text.y),
                width: vh(460),
                fontSize: vh(20),
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

function GalleryCard({
  progress,
  geom,
  card,
}: {
  progress: import("motion/react").MotionValue<number>;
  geom: Geom;
  card: Card;
}) {
  /* the frame's slice of the ride, from entering right to leaving
     left — drives the inner image's lag */
  const x = useTransform(() => {
    const leftPx = card.x * geom.scale;
    const wPx = card.w * geom.scale;
    const a = Math.max(0, (leftPx - geom.vw) / geom.overflow);
    const b = Math.min(1, (leftPx + wPx) / geom.overflow);
    const t = Math.min(1, Math.max(0, (progress.get() - a) / (b - a)));
    return `${-A + 2 * A * t}%`;
  });
  return (
    <div
      className="absolute"
      style={{ left: vh(card.x), top: vh(card.y), width: vh(card.w) }}
    >
      <p className="label mb-[1.26vh] font-medium text-ink-2">
        {card.meta.toUpperCase()}
      </p>
      <div className={`relative w-full overflow-hidden bg-surface-2 ${card.aspect}`}>
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
