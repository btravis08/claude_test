"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";
import { Pause } from "@/components/icons";

export interface CarouselItemData {
  _key?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface CarouselProps {
  mode?: "light" | "dark";
  eyebrow?: string;
  items?: CarouselItemData[];
}

const LOREM =
  "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.";

const defaultItems: CarouselItemData[] = [
  "Pioneer",
  "Presidio",
  "Osprey",
  "Cardinal",
  "Jupiter",
].map((title, i) => ({
  title,
  description: LOREM,
  image: i % 2 === 0 ? "/figma/media-portrait.png" : "/figma/campaign.png",
}));

/*
  Carousel: exact 50/50 split. The list items are links — hovering (or
  focusing) one makes it active, swapping the right-half image with the
  standard fade/1.05x-settle treatment and crossfading the description
  in the bottom left.
*/
export function Carousel({
  mode = "light",
  eyebrow = "Shop Footwear",
  items = defaultItems,
}: CarouselProps) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <section
      data-mode={mode}
      className="grid w-full grid-cols-1 bg-surface text-ink lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col justify-between gap-12 px-8 py-12 lg:px-32 lg:py-24">
        <div className="flex flex-col gap-8">
          {eyebrow && <p className="label font-medium text-ink">{eyebrow}</p>}
          <div className="flex flex-col items-start font-display text-headline-sm">
            {items.map((item, i) => (
              <a
                key={item._key ?? i}
                href="#"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`transition-colors duration-300 ${
                  i === active ? "text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {(item.title ?? "").replace(/→+$/, "")}
                {i === active && "→"}
              </a>
            ))}
          </div>
        </div>
        <div className="relative min-h-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="label max-w-[30.375rem] font-medium text-ink-2"
            >
              {current?.description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      {/* The module's height is driven by this image: 4:5 portrait at
          half the section width */}
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${current?.image ?? "/figma/media-portrait.png"})`,
            }}
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [...MEDIA_EASE] }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 flex items-end justify-end p-6">
          <button
            aria-label="Pause"
            className="flex size-7 items-center justify-center rounded-full bg-btn text-btn-fg"
          >
            <Pause />
          </button>
        </div>
      </div>
    </section>
  );
}
