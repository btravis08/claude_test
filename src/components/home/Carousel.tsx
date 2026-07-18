"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";
import { Pause } from "@/components/icons";

export interface CarouselItemData {
  _key?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface CarouselProps {
  mode?: "light" | "light-mid" | "dark-mid" | "dark";
  eyebrow?: string;
  items?: CarouselItemData[];
}

const LOREM =
  "Maecenas suspendisse ultrices pellentesque et ornare dui nisl. Eget convallis lorem faucibus tortor in. Cursus feugiat feugiat a quam vestibulum dignissim sem ullamcorper.";

const defaultImages = [
  "/figma/media-portrait.png",
  "/figma/campaign.png",
  "/figma/card-shoe.png",
  "/figma/legacy-video.jpg",
  "/figma/products/presidio-black.png",
];

const defaultItems: CarouselItemData[] = [
  "Pioneer",
  "Presidio",
  "Osprey",
  "Cardinal",
  "Jupiter",
].map((title, i) => ({
  title,
  description: LOREM,
  image: defaultImages[i % defaultImages.length],
}));

/*
  Carousel. Desktop (lg+): exact 50/50 split — the serif list items are
  links; hovering (or focusing) one makes it active, swapping the
  right-half image with the standard fade/1.05x-settle treatment and
  crossfading the description in the bottom left.

  Below lg the same content reorganizes into a vertical carousel: a
  tappable body-size list above, the main image with a tappable
  thumbnail rail on its right, and the description below the imagery.
*/
export function Carousel({
  mode = "light",
  eyebrow = "Shop Footwear",
  items = defaultItems,
}: CarouselProps) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  /* the thumb rail's travelling edge bar: measure the active thumb's
     offset within the rail so the bar slides to it */
  const railRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState({ top: 0, height: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const btn = railRef.current?.querySelectorAll("button")[active];
      if (btn) setBar({ top: btn.offsetTop, height: btn.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, items.length]);

  const description = (
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
  );

  return (
    <section
      data-mode={mode}
      className="grid w-full grid-cols-1 bg-surface text-ink lg:grid-cols-2"
    >
      {/* the deep bottom padding (spacing-11xl on desktop) keeps the
          body copy clear of the sticky purchase bar */}
      <div className="flex min-w-0 flex-col gap-12 px-4 pt-12 md:px-8 lg:justify-between lg:px-32 lg:pb-11xl lg:pt-24">
        <div className="flex flex-col gap-8">
          {/* serif title, matching the framed slider headers above */}
          {eyebrow && <p className="font-display text-title-md text-ink">{eyebrow}</p>}
          {/* desktop: serif headline list, hover-driven */}
          <div className="hidden flex-col items-start font-display text-headline-sm lg:flex">
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
          {/* mobile/tablet: tappable list in the breadcrumb link style
              (label uppercase, 1px underline ~4px under the caps); the
              underline draws left-in / right-out like the nav links */}
          <div className="flex flex-col items-start gap-2.5 lg:hidden">
            {items.map((item, i) => (
              <button
                key={item._key ?? i}
                type="button"
                onClick={() => setActive(i)}
                className={`label relative text-left font-medium transition-colors duration-300 ${
                  i === active ? "text-ink" : "text-ink-2"
                }`}
              >
                {(item.title ?? "").replace(/→+$/, "")}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-px origin-right bg-current transition-transform duration-300 ${
                    i === active ? "origin-left scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="relative hidden min-h-14 lg:block">{description}</div>
      </div>

      {/* desktop image half: the module's height is driven by this
          image, 4:5 portrait at half the section width. data-mode=dark:
          imagery inverts the fixed bars' point-sampling */}
      <div
        data-mode="dark"
        className="relative hidden aspect-[4/5] overflow-hidden bg-surface-2 lg:block"
      >
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
        <div className="absolute inset-0 flex items-end justify-end p-4 md:p-6">
          <button
            aria-label="Pause"
            className="flex size-7 items-center justify-center rounded-full bg-btn text-btn-fg"
          >
            <Pause />
          </button>
        </div>
      </div>

      {/* mobile/tablet: main image + vertical thumbnail rail, then the
          description under the imagery */}
      <div className="flex flex-col gap-8 px-4 pb-28 pt-8 md:px-8 lg:hidden">
        <div className="flex items-start gap-2">
          <div
            data-mode="dark"
            className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden bg-surface-2"
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${current?.image ?? "/figma/media-portrait.png"})`,
                }}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [...MEDIA_EASE] }}
              />
            </AnimatePresence>
          </div>
          <div ref={railRef} className="relative flex w-16 shrink-0 flex-col gap-2">
            {items.map((item, i) => (
              <button
                key={item._key ?? i}
                type="button"
                aria-label={(item.title ?? `Slide ${i + 1}`).replace(/→+$/, "")}
                onClick={() => setActive(i)}
                className={`relative aspect-square w-full overflow-hidden bg-surface-2 transition-opacity duration-300 ${
                  i === active ? "" : "opacity-60"
                }`}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              </button>
            ))}
            {/* one 2px bar on the rail's right edge travels to the
                active thumb (measured, so it survives resize) */}
            <motion.span
              aria-hidden
              className="absolute right-0 w-0.5 bg-ink"
              initial={false}
              animate={{ top: bar.top, height: bar.height }}
              transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
            />
          </div>
        </div>
        <div className="relative min-h-14">{description}</div>
      </div>
    </section>
  );
}
