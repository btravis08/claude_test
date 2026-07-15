"use client";

import { motion } from "motion/react";

/*
  Standard image treatment: when the image enters the viewport it fades
  in while settling from 1.05x to 1x. When the image sits inside a
  clickable `group` parent and hoverScale is set, hovering the parent
  scales it back up to 1.05x with the same easing.
*/
export const MEDIA_EASE = [0.22, 1, 0.36, 1] as const;

export function AnimatedMedia({
  image,
  position = "center",
  hoverScale = false,
}: {
  image: string;
  position?: string;
  hoverScale?: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [...MEDIA_EASE] }}
    >
      <div
        aria-hidden
        className={`absolute inset-0 bg-cover ${
          hoverScale
            ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            : ""
        }`}
        style={{ backgroundImage: `url(${image})`, backgroundPosition: position }}
      />
    </motion.div>
  );
}
