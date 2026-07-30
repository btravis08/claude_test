"use client";

import {
  cubicBezier,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
  Legacy "Slider Info" (Figma 33986:81346) — the framed info-card
  slider, but pinned: the section sticks while vertical scroll drives
  the track sideways through the cards, the slide indicator fills, and
  the section releases once the last card is on screen.

  Cards are the library's bordered info-card variant on the light-mid
  surface: 3:4 media, Feature Deck title, Book body at 50% ink.
*/

export interface StickyInfoCard {
  title: string;
  body: string;
  image: string;
}

const DEFAULT_CARDS: StickyInfoCard[] = [
  {
    title: "Precision",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
    image: "/figma/legacy/info-precision.jpg",
  },
  {
    title: "Performance",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
    image: "/figma/legacy/info-performance.jpg",
  },
  {
    title: "Quality",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
    image: "/figma/legacy/info-quality.jpg",
  },
  {
    title: "Comfort",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
    image: "/figma/legacy/info-comfort.jpg",
  },
  {
    title: "Lorem Ipsum Dolor Sit®",
    body: "Torsional Traction Plate for benefit lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod. Learn More",
    image: "/figma/legacy/info-tech.jpg",
  },
];

const GLIDE = cubicBezier(0.22, 1, 0.36, 1);

export function StickyInfoSlider({ cards = DEFAULT_CARDS }: { cards?: StickyInfoCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);
  /* viewport's share of the full track — the indicator's floor */
  const [share, setShare] = useState(20);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setOverflow(Math.max(0, track.scrollWidth - track.clientWidth));
      if (track.scrollWidth > 0) {
        setShare((track.clientWidth / track.scrollWidth) * 100);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cards.length]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -overflow], {
    ease: GLIDE,
  });
  /* indicator: share of the track currently revealed */
  const fill = useTransform(scrollYProgress, [0.04, 0.96], [`${share}%`, "100%"], {
    ease: GLIDE,
  });

  return (
    <div ref={ref} data-mode="light-mid" className="relative h-[250vh] w-full bg-surface text-ink">
      <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden">
        <div ref={trackRef} className="w-full overflow-hidden">
          <motion.div style={{ x }} className="flex w-max">
            {cards.map((card, i) => (
              <article
                key={i}
                className="flex w-[85vw] flex-col gap-[1.125rem] border border-line bg-surface px-6 pb-16 pt-6 sm:w-[45vw] lg:w-[31.85vw]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <p className="font-display text-[1.125rem] capitalize leading-[1.1] text-ink">
                  {card.title}
                </p>
                <p className="text-body-sm text-ink-2">{card.body}</p>
              </article>
            ))}
          </motion.div>
        </div>
        {/* slide indicator: 2px line, ink fill riding the progress */}
        <div className="h-0.5 w-full">
          <motion.div style={{ width: fill }} className="h-full bg-ink" />
        </div>
      </div>
    </div>
  );
}
