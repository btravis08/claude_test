"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
  Standard image treatment: when the image enters the viewport it fades
  in while settling from 1.05x to 1x. When the image sits inside a
  clickable `group` parent and hoverScale is set, hovering the parent
  scales it back up to 1.05x with the same easing.

  Parallax variant (hero, 50/50): the image settles from 1.2x to 1.15x
  instead — the residual 15% oversize leaves ~7.5% bleed above and
  below the frame, which the image spends by translating slower than
  the page (±6.5% of its height, scrubbed to scroll position).

  Touch devices skip the JS scrub: it's driven by scroll events,
  which iOS delivers too sparsely during momentum scrolling — the
  image visibly stair-steps. There the same ±6.5% drift runs as a CSS
  scroll-driven animation instead (.sdr-parallax in globals.css,
  compositor-driven via animation-timeline: view()), falling back to
  the static entrance where unsupported.
*/
export const MEDIA_EASE = [0.22, 1, 0.36, 1] as const;

export function AnimatedMedia({
  image,
  position = "center",
  hoverScale = false,
  parallax = false,
  entranceDuration = 0.9,
}: {
  image: string;
  position?: string;
  hoverScale?: boolean;
  parallax?: boolean;
  /* seconds for the fade/settle entrance (the hero runs it slower) */
  entranceDuration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const scrub = parallax && !touch;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6.5%", "6.5%"]);

  const inner = (
    <div
      aria-hidden
      className={`absolute inset-0 bg-cover ${
        hoverScale
          ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          : ""
      }`}
      style={{ backgroundImage: `url(${image})`, backgroundPosition: position }}
    />
  );

  return (
    /* imagery counts as dark-mode content for the fixed bars'
       point-sampling, wherever this renders */
    <div ref={ref} data-mode="dark" className="absolute inset-0 overflow-hidden">
      <motion.div
        className={`absolute inset-0 ${parallax && touch ? "sdr-parallax" : ""}`}
        style={scrub ? { y } : undefined}
        initial={{ opacity: 0, scale: scrub ? 1.2 : 1.05 }}
        whileInView={{ opacity: 1, scale: scrub ? 1.15 : 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: entranceDuration, ease: [...MEDIA_EASE] }}
      >
        {inner}
      </motion.div>
    </div>
  );
}
