"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useState } from "react";

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
  /* scopes the thumb-edge layoutId to this carousel instance */
  const railId = useId();
  const current = items[active] ?? items[0];

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
          {eyebrow && <p className="label font-medium text-ink">{eyebrow}</p>}
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
          {/* mobile/tablet: tappable body-size list; the active item
              carries the nav-link underline (same 300ms left-in /
              right-out draw as NavTextLink) */}
          <div className="flex flex-col items-start gap-1 lg:hidden">
            {items.map((item, i) => (
              <button
                key={item._key ?? i}
                type="button"
                onClick={() => setActive(i)}
                className={`relative text-left text-body-md transition-colors duration-300 ${
                  i === active ? "text-ink" : "text-ink-2"
                }`}
              >
                {(item.title ?? "").replace(/→+$/, "")}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-right bg-ink transition-transform duration-300 ${
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
          <LayoutGroup id={railId}>
            <div className="flex w-16 shrink-0 flex-col gap-2">
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
                  {/* shared 2px edge bar slides to the tapped thumb */}
                  {i === active && (
                    <motion.span
                      layoutId="thumb-edge"
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-0.5 bg-ink"
                      transition={{ duration: 0.45, ease: [...MEDIA_EASE] }}
                    />
                  )}
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
        <div className="relative min-h-14">{description}</div>
      </div>
    </section>
  );
}
