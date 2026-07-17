"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { MEDIA_EASE } from "@/components/home/AnimatedMedia";

/*
  PDP hero: required on every product page.
  - full-bleed image carousel; slides are gray product wells the user
    scrolls / drags through (arrow buttons come later)
  - the purchase bar (size select + swatches + add to cart) is affixed
    to the hero: it sticks to the top of the screen while the rest of
    the page scrolls past
*/

export interface HeroVariantData {
  name?: string;
  color?: string;
  image?: string;
}

export interface ProductHeroData {
  title?: string;
  price?: string;
  compareAtPrice?: string;
  images: string[];
  variants?: HeroVariantData[];
  sizes?: string[];
}

const DEFAULT_SIZES = ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"];

export function ProductHero({ product }: { product: ProductHeroData }) {
  const [selected, setSelected] = useState(0);
  const variants = product.variants ?? [];
  const active = variants[selected];
  /* the selected colorway leads the carousel; the product's remaining
     shots follow */
  const slides = [
    ...(active?.image ? [active.image] : []),
    ...product.images.filter((src) => src !== active?.image),
  ];

  /* mouse drag for the track (touch swipes natively) */
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved) {
      if (Math.abs(dx) < 5) return;
      drag.current.moved = true;
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    drag.current.moved = false;
    setDragging(false);
  };

  return (
    <>
      {/* image carousel */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className={`no-scrollbar grid w-full auto-cols-[100%] grid-flow-col gap-px overflow-x-auto sm:auto-cols-[42%] ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory"
        }`}
      >
        {slides.map((src, i) => (
          <div
            key={`${selected}-${i}`}
            data-slide
            className="relative aspect-square w-full snap-start bg-surface-2 sm:aspect-[6/7]"
          >
            <motion.div
              role="img"
              aria-label={`${product.title} — image ${i + 1}`}
              className="absolute inset-[14%] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${src})` }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [...MEDIA_EASE] }}
            />
          </div>
        ))}
      </div>

      {/* affixed purchase bar: pins to the top of the screen for the
          rest of the page (the PDP root is its sticky container) */}
      <div className="sticky top-0 z-30 flex w-full flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-surface px-6 py-3">
        <p className="label font-medium text-ink">{(product.title ?? "").toUpperCase()}</p>
        <p className="label flex items-baseline gap-1.5 text-ink">
          {product.compareAtPrice && (
            <s className="text-ink-3 line-through">{product.compareAtPrice}</s>
          )}
          {product.price}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-6">
          {/* colorway swatches */}
          {variants.length > 1 && (
            <span className="flex items-center gap-1.5">
              {variants.map((variant, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={variant.name ?? `Colorway ${i + 1}`}
                  onClick={() => setSelected(i)}
                  className={`size-4 rounded-xs border ${
                    i === selected ? "border-ink" : "border-line"
                  }`}
                  style={{ backgroundColor: variant.color ?? "#c8c8c4" }}
                />
              ))}
            </span>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p
              key={selected}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden text-[0.75rem] font-medium uppercase leading-none text-ink-2 md:block"
            >
              {active?.name}
            </motion.p>
          </AnimatePresence>

          {/* size select */}
          <label className="label flex h-10 items-center gap-2 rounded-xs bg-wash px-3.5 font-medium text-ink">
            <span className="sr-only">Size</span>
            <select
              defaultValue=""
              className="appearance-none bg-transparent pr-1 uppercase outline-none"
            >
              <option value="" disabled>
                Size
              </option>
              {(product.sizes?.length ? product.sizes : DEFAULT_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-ink-2">▽</span>
          </label>

          <button
            type="button"
            className="label flex h-10 min-w-[9.375rem] items-center justify-center rounded-xs bg-btn px-3.5 font-medium text-btn-fg transition-opacity hover:opacity-80"
          >
            ADD TO CART
          </button>
        </div>
      </div>
    </>
  );
}
