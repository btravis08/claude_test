"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Logo } from "@/components/Logo";

/*
  Legacy scatter field (art direction: landonorris.com's gallery
  stream). A tall, normally-scrolling canvas of scattered images, each
  with a small place/year caption, and a couple of serif quotes signed
  with the tiger mark in between.

  The containers do NOT parallax — they move with the page. The image
  INSIDE each frame is oversized and translates slightly slower than
  the scroll (clipped by its container), which gives every photo a
  quiet drag as it passes.
*/

/* inner-parallax amplitude: the image is 2A taller than its frame and
   slides from -A to +A while the frame crosses the viewport */
const A = 9; // percent

function ScatterImage({
  src,
  meta,
  aspect,
  width,
  top,
  left,
  tone,
}: {
  src: string;
  meta: string;
  aspect: string;
  width: string;
  top: string;
  left: string;
  /* a few frames carry the sage tint the reference uses */
  tone?: "tint";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-A}%`, `${A}%`]);

  return (
    <div ref={ref} className="absolute" style={{ top, left, width }}>
      <p className="label mb-2 text-ink-2">{meta.toUpperCase()}</p>
      <div className={`relative w-full overflow-hidden rounded-xs bg-surface-2 ${aspect}`}>
        <motion.div
          style={{ y, top: `-${A}%`, height: `${100 + A * 2}%` }}
          className="absolute inset-x-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
        </motion.div>
        {tone === "tint" && (
          <div className="pointer-events-none absolute inset-0 bg-surface/45 mix-blend-color" aria-hidden />
        )}
      </div>
    </div>
  );
}

function ScatterQuote({
  children,
  top,
  left,
  width,
}: {
  children: React.ReactNode;
  top: string;
  left: string;
  width: string;
}) {
  return (
    <div className="absolute flex flex-col gap-5" style={{ top, left, width }}>
      <p className="font-display text-headline-sm leading-snug text-ink">{children}</p>
      {/* the tiger mark signs each quote */}
      <Logo className="h-4 w-auto text-ink" />
    </div>
  );
}

/* Layout tuned against the reference frames: alternating columns,
   varied scales, generous air. Tops are % of the 380vh canvas. */
const IMAGES = [
  { src: "/figma/legacy/float-putt.jpg",   meta: "Practice Green, 2024", aspect: "aspect-[2/3]", width: "clamp(11rem, 22vw, 24rem)", top: "1.5%", left: "20vw" },
  { src: "/figma/legacy/float-crowd.jpg",  meta: "Riviera, 2024",        aspect: "aspect-[4/3]", width: "clamp(15rem, 38vw, 42rem)", top: "9%",   left: "55vw" },
  { src: "/figma/journal/stream-03.jpg",   meta: "Fitting Room, 2024",   aspect: "aspect-[3/4]", width: "clamp(9rem, 16vw, 17rem)",  top: "25%",  left: "30vw", tone: "tint" as const },
  { src: "/figma/journal/stream-06.jpg",   meta: "Sawgrass, 2024",       aspect: "aspect-[4/3]", width: "clamp(15rem, 42vw, 46rem)", top: "36%",  left: "8vw" },
  { src: "/figma/journal/stream-11.jpg",   meta: "Media Day, 2024",      aspect: "aspect-[3/4]", width: "clamp(9rem, 16vw, 17rem)",  top: "33%",  left: "76vw", tone: "tint" as const },
  { src: "/figma/journal/stream-10.jpg",   meta: "St Andrews, 2022",     aspect: "aspect-[3/2]", width: "clamp(11rem, 20vw, 22rem)", top: "56%",  left: "42vw" },
  { src: "/figma/legacy/float-shoes.jpg",  meta: "Pebble Beach, 2024",   aspect: "aspect-[2/1]", width: "clamp(14rem, 30vw, 33rem)", top: "71%",  left: "12vw" },
  { src: "/figma/legacy/hero.jpg",         meta: "Studio, 2024",         aspect: "aspect-[4/3]", width: "clamp(15rem, 40vw, 44rem)", top: "81%",  left: "34vw" },
];

export function FloatingWords() {
  return (
    <div
      data-mode="light"
      className="relative h-[380vh] w-full overflow-hidden border-y border-line bg-surface text-ink"
    >
      {IMAGES.map((image) => (
        <ScatterImage key={image.src} {...image} />
      ))}
      <ScatterQuote top="4%" left="60vw" width="clamp(14rem, 26vw, 28rem)">
        Pursue better. Always.
      </ScatterQuote>
      <ScatterQuote top="62%" left="66vw" width="clamp(15rem, 26vw, 30rem)">
        You carry the legacy of a champion.
      </ScatterQuote>
    </div>
  );
}
