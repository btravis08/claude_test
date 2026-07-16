"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/*
  Standard image treatment: when the image enters the viewport it fades
  in while settling from 1.05x to 1x. When the image sits inside a
  clickable `group` parent and hoverScale is set, hovering the parent
  scales it back up to 1.05x with the same easing.

  Parallax variant (hero, 50/50): the image settles from 1.2x to 1.15x
  instead — the residual 15% oversize leaves ~7.5% bleed above and
  below the frame, which the image spends by translating slower than
  the page (±6.5% of its height, scrubbed to scroll position).
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
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={parallax ? { y } : undefined}
        initial={{ opacity: 0, scale: parallax ? 1.2 : 1.05 }}
        whileInView={{ opacity: 1, scale: parallax ? 1.15 : 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: entranceDuration, ease: [...MEDIA_EASE] }}
      >
        {inner}
      </motion.div>
    </div>
  );
}
