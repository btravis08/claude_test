"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/*
  Legacy full-bleed carousel (Figma 34346:77144). A timed, full-
  viewport slideshow:

  - full-width background image under a dark scrim
  - top center: the slide number, an 82px hairline that fills over
    the slide's dwell, and the total
  - a giant serif headline rail — previous and next titles bleed off
    the page at low opacity (765.67px slot spacing at 1440); on
    advance the rail slides one slot left
  - a 287×383 portrait media well bottom-center, cut by the fold; the
    incoming image slides through the well as the outgoing one leaves
  - body copy bottom-left fades in

  The step counter is monotonic (titles are laid on an endless rail),
  so the travel is always leftward — no rewind on loop.
*/

const DWELL_S = 6;
/* every slide transition rides the dramatic bezier for 2s */
const TRANS_S = 2;
const DRAMA = [0.85, 0, 0.15, 1] as const;
/* headline slot spacing: 765.67px / 1440 */
const SLOT = 53.17; // vw

interface Slide {
  title: string;
  bg: string;
  media: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    title: "Precision",
    bg: "/figma/journal/stream-10.jpg",
    media: "/figma/legacy/float-putt.jpg",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
  },
  {
    title: "Performance",
    bg: "/figma/journal/stream-06.jpg",
    media: "/figma/journal/stream-11.jpg",
    body: "Enim diam in cursus duis arcu aliquet. Turpis id enim mi iaculis erat. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
  },
  {
    title: "Quality",
    bg: "/figma/legacy/hero.jpg",
    media: "/figma/journal/stream-03.jpg",
    body: "Sit nunc ut et lorem tellus vitae nibh dictum ornare. Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet.",
  },
  {
    title: "Comfort",
    bg: "/figma/legacy/float-crowd.jpg",
    media: "/figma/journal/stream-01.jpg",
    body: "Turpis id enim mi iaculis erat. Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare.",
  },
  {
    title: "Craft",
    bg: "/figma/journal/stream-05.jpg",
    media: "/figma/legacy/float-shoes.jpg",
    body: "Enim diam in cursus duis arcu aliquet. Sit nunc ut et lorem tellus vitae nibh dictum ornare. Turpis id enim mi iaculis erat.",
  },
];

export function FullBleedCarousel() {
  /* monotonic under autoplay — the rail travels leftward; clicking a
     neighbor title jumps straight to it */
  const [step, setStep] = useState(0);
  const slide = SLIDES[((step % SLIDES.length) + SLIDES.length) % SLIDES.length];

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => s + 1), DWELL_S * 1000);
    return () => clearTimeout(t);
  }, [step]);

  /* decode everything up front so advances never decode-jank */
  useEffect(() => {
    SLIDES.forEach((s) => {
      [s.bg, s.media].forEach((src) => {
        const img = new Image();
        img.src = src;
        img.decode?.().catch(() => {});
      });
    });
  }, []);

  /* the rail renders a window around the current step */
  const rail: number[] = [];
  for (let i = step - 2; i <= step + 2; i++) rail.push(i);

  return (
    <section
      data-mode="dark"
      className="relative h-screen w-full overflow-hidden bg-black text-ink md:h-[90vh]"
    >
      {/* background: quick crossfade, incoming above outgoing */}
      <AnimatePresence initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: TRANS_S, ease: DRAMA },
          }}
          exit={{ opacity: 0, transition: { duration: TRANS_S, ease: DRAMA } }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.bg}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/35" aria-hidden />
        </motion.div>
      </AnimatePresence>

      {/* timer: number · filling hairline · total */}
      <div className="absolute inset-x-0 top-8 flex items-center justify-center gap-[0.4375rem] text-white">
        <span className="label relative block h-[1em] w-[2ch] overflow-hidden font-medium">
          <AnimatePresence initial={false}>
            <motion.span
              key={step}
              initial={{ y: "-110%" }}
              animate={{ y: "0%", transition: { duration: 1.2, ease: DRAMA } }}
              exit={{ y: "110%", transition: { duration: 1.2, ease: DRAMA } }}
              className="absolute inset-0"
            >
              {String((((step % SLIDES.length) + SLIDES.length) % SLIDES.length) + 1).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="relative h-px w-[5.125rem] bg-white/30">
          <motion.span
            key={step}
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: DWELL_S, ease: "linear" }}
            className="absolute inset-y-0 left-0 bg-white"
          />
        </span>
        <span className="label font-medium text-white/70">
          {String(SLIDES.length).padStart(2, "0")}
        </span>
      </div>

      {/* headline rail: current centered, neighbors bleeding off-page */}
      <div className="absolute left-1/2 top-[42.2%]">
        <motion.div
          animate={{ x: `${-step * SLOT}vw` }}
          transition={{ duration: TRANS_S, ease: DRAMA }}
          className="relative"
        >
          {rail.map((i) => (
            <motion.p
              key={i}
              animate={{ opacity: i === step ? 1 : 0.35 }}
              transition={{ duration: TRANS_S * 0.8, ease: DRAMA }}
              onClick={() => i !== step && setStep(i)}
              role={i !== step ? "button" : undefined}
              className={`absolute -translate-x-1/2 whitespace-nowrap font-display text-white ${
                i === step ? "" : "cursor-pointer"
              }`}
              style={{
                left: `${i * SLOT}vw`,
                fontSize: "min(5.2vw, 4.7rem)",
                lineHeight: 1.2,
              }}
            >
              {SLIDES[((i % SLIDES.length) + SLIDES.length) % SLIDES.length].title}
            </motion.p>
          ))}
        </motion.div>
      </div>

      {/* media well: the incoming image slides through as the
          outgoing one leaves (both clipped by the well) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: "40.03%",
          top: "68.72%",
          width: "19.95vw",
          minWidth: "13rem",
          aspectRatio: "287.25 / 383",
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={step}
            initial={{ x: "105%" }}
            animate={{ x: "0%", transition: { duration: TRANS_S, ease: DRAMA } }}
            exit={{ x: "-105%", transition: { duration: TRANS_S, ease: DRAMA } }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.media}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* body copy, bottom left */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: TRANS_S * 0.5 } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="absolute bottom-8 left-8 w-72 text-body-sm text-white/90"
        >
          {slide.body}
        </motion.p>
      </AnimatePresence>
    </section>
  );
}
