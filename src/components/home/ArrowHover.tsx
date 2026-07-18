"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import Link from "next/link";

/*
  Arrow-swap hover from the design storyboard: on hover the arrow
  slides off in the direction it points while fading, then re-enters
  from the opposite side and settles. dx/dy give the pointing
  direction (right = {1,0}, left = {-1,0}, up-right = {1,-1}).
*/

const DIST = 14;

const swap = (dx: number, dy: number): Variants => ({
  rest: { x: 0, y: 0, opacity: 1 },
  hover: {
    x: [0, dx * DIST, -dx * DIST, 0],
    y: [0, dy * DIST, -dy * DIST, 0],
    opacity: [1, 0, 0, 1],
    transition: {
      duration: 0.3,
      times: [0, 0.42, 0.58, 1],
      ease: ["easeIn", "linear", "easeOut"],
    },
  },
});

export function ArrowSwap({
  dx = 1,
  dy = 0,
  children,
}: {
  dx?: number;
  dy?: number;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex overflow-hidden">
      <motion.span className="inline-flex" variants={swap(dx, dy)}>
        {children}
      </motion.span>
    </span>
  );
}

/* Motion-enabled hover parents: set initial="rest" / whileHover="hover"
   so the ArrowSwap child animates when the whole control is hovered */

export function ArrowButton({
  disabled,
  ...props
}: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      initial="rest"
      whileHover={disabled ? undefined : "hover"}
      animate="rest"
      disabled={disabled}
      {...props}
    />
  );
}

/* internal hrefs ride next/link so the arrow CTAs navigate client-side */
const MotionLink = motion.create(Link);

export function ArrowLink({ href, ...props }: React.ComponentProps<typeof motion.a>) {
  const Comp = (
    typeof href === "string" && href.startsWith("/") ? MotionLink : motion.a
  ) as typeof motion.a;
  return <Comp href={href} initial="rest" whileHover="hover" animate="rest" {...props} />;
}
